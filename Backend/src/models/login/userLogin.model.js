/**
 * UserLogin Model
 * 
 * Logics:
 * - Credentials:
 *   username (unique, lowercase), password (hashed in pre-save hook).
 * - User Link:
 *   user (ref User, unique) ensures one credential per user.
 * - Security Flags:
 *   forcePasswordChange, failedLoginAttempts, lockLevel, lockUntil, isPermanentlyLocked.
 * - Session State:
 *   isLoggedIn, lastLogin, loggedInDevices with per-device refreshToken and history.
 * - Hooks/Methods:
 *   - pre('save'): hash password if modified.
 *   - comparePassword(candidate): bcrypt compare.
 *   - generateAccessToken(deviceId): JWT with optional device versioning.
 *   - generateRefreshToken(deviceId, ip, ua): issues refresh, updates device entries, persists.
 */

import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const userLoginSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    // PIN for quick re-authentication (optional, 4-6 digits)
    pin: {
      type: String,
      default: null,
      select: false,
      note: 'Hashed PIN for optional quick authentication (4-6 digits)'
    },
    // Force user to change password on next login
    forcePasswordChange: {
      type: Boolean,
      default: false,
    },
    refreshTokens: [
      {
        token: { type: String },
        deviceId: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    failedLoginAttempts: { type: Number, default: 0 },
    lockLevel: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    isPermanentlyLocked: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    lastLogin: { type: Date },


    //todo Start date for password expiry clock (set on first login after password change)

    passwordExpiryStart: { type: Date, default: null },


    //todo Optional: Store password history (last 5 hashes) to prevent reuse
    lastPasswordChange: [
      {
        // When the password was changed
        changedAt: { type: Date, default: Date.now },
        
        // Network and Device Information
        ipAddress: String, // IP address from which change was initiated
        
        deviceId: String, // Device identifier if changed from logged-in device
        
        // Who Changed It
       
        changedByUserId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null, // Null if self, otherwise admin user ID
        },
        
        
          
        // Previous Password Hash (for recovery purposes - encrypted)
        previousPasswordHash: String, // Can be used to prevent reuse
        
        // Audit Trail
        // mfaVerified: { type: Boolean, default: false }, // Was MFA verified for this change
        requiresVerification: { type: Boolean, default: false }, // Needs email/phone verification
        verificationCode: { type: String, select: false }, // Hashed verification code
        verificationExpiresAt: Date,
        verificationAttempts: { type: Number, default: 0 },
        
        // Session Information
        sessionId: String, // Session ID in which change was made
        correlationId: String, // For tracking related operations
      }
      
    ],

    totalLoginCount: { type: Number, default: 0 }, // Total number of successful logins across all devices
    loggedInDevices: [
      {
        deviceId: { type: String, default: () => uuidv4() },
        ipAddress: String,
        userAgent: String,
        loginCount: { type: Number, default: 0 },
        refreshToken: String,
        tokenVersion: { type: Number, default: 0 },
        loginHistory: [
          {
            loginAt: { type: Date, default: Date.now },
            logoutAt: Date,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook for password hashing
userLoginSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Pre-save hook for PIN hashing
userLoginSchema.pre("save", async function (next) {
  if (!this.isModified("pin") || !this.pin) return next();
  const salt = await bcryptjs.genSalt(10);
  this.pin = await bcryptjs.hash(this.pin, salt);
  next();
});

// Instance method to compare password
userLoginSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Instance method to compare PIN
userLoginSchema.methods.comparePin = async function (candidatePin) {
  if (!this.pin) return false;
  return await bcryptjs.compare(candidatePin, this.pin);
};

// Instance method to generate access token
userLoginSchema.methods.generateAccessToken = function (deviceId) {
  const device = this.loggedInDevices.find(d => d.deviceId === deviceId);
  const tokenVersion = device ? device.tokenVersion : 0;
  return jwt.sign(
    { userId: this.user, deviceId, tokenVersion },
    process.env.JWT_SECRET || "defaultsecret",
    { expiresIn: "15m" }
  );
};

// Instance method to generate refresh token
userLoginSchema.methods.generateRefreshToken = function (deviceId, ip, ua) {
  const refreshToken = jwt.sign(
    { userId: this.user, deviceId },
    process.env.JWT_REFRESH_SECRET || "refreshsecret",
    { expiresIn: "7d" }
  );

  // Update or add device entry
  let device = this.loggedInDevices.find(d => d.deviceId === deviceId);
  if (!device) {
    device = {
      deviceId,
      ipAddress: ip,
      userAgent: ua,
      loginCount: 0,
      tokenVersion: 0,
      loginHistory: [],
    };
    this.loggedInDevices.push(device);
  }

  device.refreshToken = refreshToken;
  device.loginCount += 1;
  device.loginHistory.push({ loginAt: new Date() });

  return refreshToken;
};

// Instance method to logout from device
userLoginSchema.methods.logoutDevice = function (deviceId) {
  const device = this.loggedInDevices.find(d => d.deviceId === deviceId);
  if (device) {
    device.logoutAt = new Date();
    device.refreshToken = null;
  }
  this.isLoggedIn = this.loggedInDevices.some(d => d.refreshToken);
};

// Instance method to check if account is locked
userLoginSchema.methods.isLocked = function () {
  if (this.isPermanentlyLocked) return true;
  if (this.lockUntil && this.lockUntil > Date.now()) return true;
  return false;
};

// Instance method to increment failed attempts
userLoginSchema.methods.incrementFailedAttempts = function () {
  this.failedLoginAttempts += 1;
  const limit = parseInt(process.env.LOGIN_ATTEMPT_LIMIT) || 5;

  if (this.failedLoginAttempts >= limit) {
    this.lockLevel += 1;

    if (this.lockLevel === 1) {
      // First lock: 5 minutes
      const window = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_FIRST) || 5;
      this.lockUntil = new Date(Date.now() + window * 60 * 1000);
    } else if (this.lockLevel === 2) {
      // Second lock: 10 minutes
      const window = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_SECOND) || 10;
      this.lockUntil = new Date(Date.now() + window * 60 * 1000);
    } else if (this.lockLevel >= 3) {
      // Third time: Permanent lock
      this.isPermanentlyLocked = true;
      this.lockUntil = null; // No expiration
    }

    this.failedLoginAttempts = 0; // Reset attempts after locking
  }
};

// Instance method to check if password is expired
userLoginSchema.methods.isPasswordExpired = function () {
  if (!this.passwordExpiryStart) return false;
  const expiryDays = parseInt(process.env.LAST_PASSWORD_CHANGE_WINDOW) || 90;
  const expiryDate = new Date(this.passwordExpiryStart);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  return new Date() > expiryDate;
};

// Instance method to change password
userLoginSchema.methods.changePassword = async function (newPassword, changedByUserId = null, ipAddress = null, deviceId = null, sessionId = null) {
  // Store previous password hash in history
  if (this.lastPasswordChange.length >= 5) {
    this.lastPasswordChange.shift(); // Keep only last 5
  }
  this.lastPasswordChange.push({
    changedAt: new Date(),
    ipAddress,
    deviceId,
    changedByUserId,
    previousPasswordHash: this.password, // Store old hash
    sessionId,
    correlationId: uuidv4(),
  });

  // Update password
  this.password = newPassword; // Will be hashed by pre-save hook
  this.passwordExpiryStart = new Date(); // Reset expiry clock
  this.forcePasswordChange = false; // Reset force change flag

  // Increment token version for all devices to invalidate old tokens
  this.loggedInDevices.forEach(device => {
    device.tokenVersion += 1;
  });

  await this.save();
};

export const UserLogin = mongoose.model("UserLogin", userLoginSchema);
