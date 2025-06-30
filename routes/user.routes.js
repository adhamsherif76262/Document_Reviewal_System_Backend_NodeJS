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

// @route   POST /api/users/register
router.post('/register', registerUser);

//@route POST /api/users/verify-email
router.post('/verify-email', verifyAccount);

//@route POST /api/users/verify-email
router.post('/resend-verification', resendVerificationOTP);

// @route   POST /api/users/login
router.post('/login', loginUser);

// Protected
router.post('/logout', protect, logoutUser); 

// @route   POST /api/users/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/users/reset-password
router.post('/reset-password', resetPassword);

// @route   GET /api/users/my-submissions
router.get('/my-submissions', protect, getMyDocuments);

// ✅ Admin-only route to get all user statistics
router.get('/stats', protect, isAdmin, getAllUserStats);

// 👇 Add this new route for admin stats
router.get('/admins', protect, isAdmin, getAdminStats);

module.exports = router;
