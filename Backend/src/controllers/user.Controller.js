import { User } from "../models/users/user.Model.js";
import { UserLogin } from "../models/login/userLogin.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "defaultsecret", {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { userId, name, email, username, password, designation, department, gender, dob, phone_no, dateOfJoining, canLogin, pin } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if username exists
    const loginExists = await UserLogin.findOne({ username });
    if (loginExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create user
    const user = await User.create({
      userId,
      name,
      email,
      designation,
      department,
      gender,
      dob,
      phone_no,
      dateOfJoining,
      canLogin,
    });

    // Create login credentials if canLogin
    let userLogin = null;
    if (canLogin && password) {
      userLogin = await UserLogin.create({
        user: user._id,
        username,
        password,
        pin: pin || null,
      });
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        designation: user.designation,
        department: user.department,
        username: userLogin ? userLogin.username : null,
        token: userLogin ? generateToken(user._id) : null,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { username, password, deviceId, ipAddress, userAgent } = req.body;

    const userLogin = await UserLogin.findOne({ username }).populate('user');

    if (!userLogin || !(await userLogin.comparePassword(password))) {
      // Increment failed attempts
      if (userLogin) {
        userLogin.incrementFailedAttempts();
        await userLogin.save();
      }
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if account is locked
    if (userLogin.isLocked()) {
      if (userLogin.isPermanentlyLocked) {
        return res.status(423).json({ message: "Account is permanently locked. Contact admin." });
      } else {
        const remainingTime = Math.ceil((userLogin.lockUntil - Date.now()) / (1000 * 60)); // in minutes
        return res.status(423).json({ message: `Account is locked due to too many failed attempts. Try again in ${remainingTime} minutes.` });
      }
    }

    // Check if password is expired - prevent login
    if (userLogin.isPasswordExpired()) {
      return res.status(403).json({
        message: "Your password has expired. Please change your password to continue.",
        code: "PASSWORD_EXPIRED",
        forcePasswordChange: true,
        allowChangeOnly: true // Indicates login not allowed, only password change
      });
    }

    // Set password expiry start on first login after password change
    if (!userLogin.passwordExpiryStart) {
      userLogin.passwordExpiryStart = new Date();
      await userLogin.save();
    }

    // Reset failed attempts on successful login
    userLogin.resetFailedAttempts();

    // Generate tokens
    const accessToken = userLogin.generateAccessToken(deviceId);
    const refreshToken = userLogin.generateRefreshToken(deviceId, ipAddress, userAgent);

    // Update login status
    userLogin.isLoggedIn = true;
    userLogin.lastLogin = new Date();
    userLogin.totalLoginCount += 1;

    await userLogin.save();

    res.json({
      _id: userLogin.user._id,
      userId: userLogin.user.userId,
      name: userLogin.user.name,
      email: userLogin.user.email,
      designation: userLogin.user.designation,
      department: userLogin.user.department,
      username: userLogin.username,
      accessToken,
      refreshToken,
      forcePasswordChange: userLogin.forcePasswordChange,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    const userLogin = await UserLogin.findOne({ user: req.user._id });
    if (userLogin) {
      userLogin.logoutDevice(req.body.deviceId);
      await userLogin.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (force change when expired)
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userLogin = await UserLogin.findOne({ user: req.user._id });

    if (!userLogin) {
      return res.status(404).json({ message: "User login not found" });
    }

    // Skip current password check if force change is required
    const skipCurrentCheck = userLogin.forcePasswordChange || userLogin.isPasswordExpired();

    if (!skipCurrentCheck) {
      // Verify current password for normal changes
      if (!(await userLogin.comparePassword(currentPassword))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    // Change password
    await userLogin.changePassword(
      newPassword,
      null, // self change
      req.ip,
      req.deviceId,
      req.sessionId || uuidv4()
    );

    res.json({
      message: "Password changed successfully",
      forceChangeCompleted: skipCurrentCheck
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/users/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "refreshsecret");
    const userLogin = await UserLogin.findOne({ user: decoded.userId });

    if (!userLogin) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const device = userLogin.loggedInDevices.find(d => d.deviceId === decoded.deviceId && d.refreshToken === token);
    if (!device) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = userLogin.generateAccessToken(decoded.deviceId);

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userLogin = await UserLogin.findOne({ user: req.user._id });

    if (user) {
      const passwordExpired = userLogin ? userLogin.isPasswordExpired() : false;
      const expiryDate = userLogin?.passwordExpiryStart ?
        new Date(userLogin.passwordExpiryStart.getTime() + (parseInt(process.env.LAST_PASSWORD_CHANGE_WINDOW) || 90) * 24 * 60 * 60 * 1000) :
        null;

      res.json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        designation: user.designation,
        department: user.department,
        gender: user.gender,
        dob: user.dob,
        phone_no: user.phone_no,
        dateOfJoining: user.dateOfJoining,
        isActive: user.isActive,
        passwordStatus: {
          expired: passwordExpired,
          expiryDate: expiryDate,
          forceChange: userLogin?.forcePasswordChange || false,
          daysUntilExpiry: expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null
        }
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.designation = req.body.designation || user.designation;
      user.department = req.body.department || user.department;
      user.gender = req.body.gender || user.gender;
      user.dob = req.body.dob || user.dob;
      user.phone_no = req.body.phone_no || user.phone_no;
      user.dateOfJoining = req.body.dateOfJoining || user.dateOfJoining;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        designation: updatedUser.designation,
        department: updatedUser.department,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.designation = req.body.designation || user.designation;
      user.department = req.body.department || user.department;
      user.gender = req.body.gender || user.gender;
      user.dob = req.body.dob || user.dob;
      user.phone_no = req.body.phone_no || user.phone_no;
      user.dateOfJoining = req.body.dateOfJoining || user.dateOfJoining;
      user.canLogin = req.body.canLogin !== undefined ? req.body.canLogin : user.canLogin;
      user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        designation: updatedUser.designation,
        department: updatedUser.department,
        canLogin: updatedUser.canLogin,
        isActive: updatedUser.isActive,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};