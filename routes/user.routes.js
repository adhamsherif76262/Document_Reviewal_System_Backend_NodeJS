const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const {
  registerUser,
  verifyAccount,
  resendVerificationOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUserStats,
  getAdminStats,
  logoutUser,
  getMyDocuments,
} = require('../controllers/user.controller');

const {
  validateUserRegister,
  validateVerifyEmail,
  validateResendVerification,
  validateUserLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../middlewares/validation');

const {
  defaultLimiter,
  authLimiter
} = require('../utils/rateLimiter');


// @route   POST /api/users/register
router.post('/register',authLimiter,validateUserRegister, registerUser);

//@route POST /api/users/verify-email
router.post('/verify-email',authLimiter,validateVerifyEmail, verifyAccount);

//@route POST /api/users/verify-email
router.post('/resend-verification',authLimiter,validateResendVerification, resendVerificationOTP);

// @route   POST /api/users/login
router.post('/login',authLimiter,validateUserLogin, loginUser);

// Protected
router.post('/logout', protect, logoutUser); 

// @route   POST /api/users/forgot-password
router.post('/forgot-password',authLimiter,validateForgotPassword, forgotPassword);

// @route   POST /api/users/reset-password
router.post('/reset-password',authLimiter,validateResetPassword, resetPassword);

// @route   GET /api/users/my-submissions
router.get('/my-submissions', protect, getMyDocuments);

// ✅ Admin-only route to get all user statistics
router.get('/stats', protect, isAdmin, getAllUserStats);

// 👇 Add this new route for admin stats
router.get('/admins', protect, isAdmin, getAdminStats);

module.exports = router;
