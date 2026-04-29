import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default:"NA",
      trim: true,
    },
    department: {
      type: String,
      default:"NA",
      trim: true,
    },
     gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },
     dob: {
      type: Date,
      default: null
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      note: 'Link to department for scope-based access'
    },

    email: {
      type: String,
      required: true, // Made required for login
      unique: true,
      lowercase: true,
      trim: true,
    },

    personalEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null
    },

    phone_no: {
      type: String, // Changed to String for proper validation
      trim: true,
      minlength: 10,
      maxlength: 10,
    },

    canLogin:{
      type:Boolean,
      default:false
    },

     dateOfJoining: {
      type: Date,
      default: null
    },


   
    isActive: {
      type: Boolean,
      default: true,
    },

    inactiveAt: {
      type: Date,
      default: null,
    },

    inactiveBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    inactiveReason: {
      type: [
        {
          reason: {
            type: String,
            trim: true,
            required: true,
          },
          status: {
            type: Boolean,
            required: true,
          },
          changedAt: {
            type: Date,
            default: () => new Date(),
          },
          changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
        }
      ],
      default: () => [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Indexes for better query performance
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ departmentId: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save hook for password hashing (if using bcrypt)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Assuming bcrypt is installed
  // const bcrypt = require('bcrypt');
  // this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // const bcrypt = require('bcrypt');
  // return await bcrypt.compare(candidatePassword, this.password);
  return candidatePassword === this.password; // Placeholder, use bcrypt in production
};

export const User = mongoose.model("User", userSchema);
