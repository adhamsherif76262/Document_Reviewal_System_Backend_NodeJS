// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define schema structure
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    phone: {
      type: String,
      default: null,
    },
    preferredVerificationMethod: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email',
    },
    phoneVerificationOTP: String,
    phoneVerificationExpire: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
    },
    emailVerificationExpire: {
      type: Date,
    },
    lastOTPResend: {
      type: Date,
      default: null,
    },
       // OTP support
    resetPasswordOTP: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Automatically add createdAt & updatedAt
  }
);

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is new or changed
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('verificationStatus').get(function () {
  if (this.isVerified) return `Verified via ${this.preferredVerificationMethod}`;
  return `Pending ${this.preferredVerificationMethod} verification`;
});

// 2. Add indexes

// 📌 Ensure fast user lookup by email and prevent duplicates
userSchema.index({ email: 1 }, { unique: true });

// 📌 If you allow SMS verification, ensure phone number is unique (if provided)
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
