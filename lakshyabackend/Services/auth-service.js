const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const mongoose = require('mongoose');
const UserModel = require('../models/user-model');
const { ROLES } = require('../Library/roles');
const sendEmail = require("../Library/send-emails");

const ensureDatabaseConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is unavailable. Please check MongoDB connection and try again.');
    error.statusCode = 503;
    error.success = false;
    error.errorField = 'message';
    throw error;
  }
};

/**
 * Service function for user signup
 * @param {Object} data - { name, email, password, number, role, companyName, location }
 * @returns {Promise<Object>} - Success result
 * @throws {Error} - Error with statusCode and message properties
 */
const signupService = async (data) => {
  ensureDatabaseConnection();

  const { name, email, password, number, role, companyName, location } = data;

  // Define allowed signup roles
  const ALLOWED_SIGNUP_ROLES = [
    ROLES.JOB_SEEKER,
    ROLES.RECRUITER,
  ];

  // Validate role
  if (!role || !ALLOWED_SIGNUP_ROLES.includes(role)) {
    const error = new Error("Invalid role for signup");
    error.statusCode = 403;
    error.success = false;
    error.errorField = "error";
    throw error;
  }

  // Validate recruiter-specific fields
  if (role === ROLES.RECRUITER) {
    if (!companyName || !location) {
      const error = new Error("Company name and location are required for recruiters");
      error.statusCode = 400;
      error.success = false;
      error.errorField = "message";
      throw error;
    }
  }

  // Additional check for admin role (redundant but keeping for backward compatibility)
  if (!ALLOWED_SIGNUP_ROLES.includes(role)) {
    const error = new Error("Admin signup is not allowed");
    error.statusCode = 403;
    error.success = false;
    error.errorField = "message";
    throw error;
  }

  // Check if user already exists
  const userExists = await UserModel.findOne({ email });
  if (userExists) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    error.success = false;
    error.errorField = "error";
    throw error;
  }

  // Create new user model
  const userModel = new UserModel({
    name,
    email,
    password,
    number,
    role,
    companyName: role === ROLES.RECRUITER ? companyName : undefined,
    location: role === ROLES.RECRUITER ? location : undefined,
  });

  // Hash password
  userModel.password = await bcrypt.hash(password, 10);

  // Save user to database
  await userModel.save();

  return {
    message: "User registered successfully",
    success: true,
  };
};

/**
 * Service function for user login
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} - JWT token and user details
 * @throws {Error} - Error with statusCode and message properties
 */
const loginService = async (data) => {
  ensureDatabaseConnection();

  const { email, password } = data;

  // Find user by email (include password field which is hidden by default)
  const user = await UserModel.findOne({ email }).select('+password');
  const errorMsg = "Auth failed, email or password is wrong";

  if (!user) {
    const error = new Error(errorMsg);
    error.statusCode = 403;
    error.success = false;
    error.errorField = "message";
    throw error;
  }

  // Compare passwords
  const isPassEqual = await bcrypt.compare(password, user.password);
  if (!isPassEqual) {
    const error = new Error(errorMsg);
    error.statusCode = 403;
    error.success = false;
    error.errorField = "message";
    throw error;
  }

  // Generate JWT token
  const jwtToken = jwt.sign(
    { email: user.email, id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    message: "Login successful",
    success: true,
    jwtToken,
    _id: user._id.toString(), // Return _id for frontend query keys
    email: user.email,
    name: user.name,
    fullName: user.name, // Add fullName for frontend compatibility
    role: user.role,
    profileImageUrl: user.profileImageUrl || null, // Include avatar
  };
};

/**
 * Service function for forgot password
 * @param {Object} data - { email }
 * @returns {Promise<Object>} - Success result
 * @throws {Error} - Error with statusCode and message properties
 */
const forgotPasswordService = async (data) => {
  ensureDatabaseConnection();

  const { email } = data;

  // Find user by email
  const user = await UserModel.findOne({ email });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.success = false;
    error.errorField = "message";
    throw error;
  }

  // Generate NEW OTP every time (send or resend)
  const otp = crypto.randomInt(100000, 999999).toString();

  // Save OTP and expiry to user
  user.resetOTP = otp;
  user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send OTP via email
  await sendEmail(
    user.email,
    "Password Reset OTP",
    `Your OTP is ${otp}. It will expire in 10 minutes.`
  );

  return {
    success: true,
    message: "OTP sent to your email",
  };
};

/**
 * Service function for reset password
 * @param {Object} data - { email, otp, newPassword }
 * @returns {Promise<Object>} - Success result
 * @throws {Error} - Error with statusCode and message properties
 */
const resetPasswordService = async (data) => {
  ensureDatabaseConnection();

  const { email, otp, newPassword } = data;

  // Find user and validate OTP
  const user = await UserModel.findOne({ email });
  if (
    !user ||
    user.resetOTP !== otp ||
    user.resetOTPExpiry < Date.now()
  ) {
    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    error.success = false;
    error.errorField = "message";
    throw error;
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 10);

  // Clear OTP fields
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;

  // Save updated user
  await user.save();

  return {
    success: true,
    message: "Password reset successful",
  };
};

module.exports = {
  signupService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
};
