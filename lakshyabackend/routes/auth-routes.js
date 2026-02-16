const express = require('express');
const router = express.Router();
const authController = require('../Controller/auth-controller');
const { signupValidation, loginValidation } = require('../Middleware/auth-validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (job_seeker or recruiter)
 * @access  Public
 */
router.post('/register', signupValidation, authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;
