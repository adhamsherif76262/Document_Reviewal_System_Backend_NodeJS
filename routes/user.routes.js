const express = require('express');
const router = express.Router();
const { protect, isAdmin ,isSuperAdmin} = require('../middlewares/auth');
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
  generateInviteCode,
  // extendUserExpiryDate,
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

// Returns current user based on the httpOnly cookie
router.get("/me", protect, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
  // res.json(req.user);
});

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
router.get('/admins', protect, isSuperAdmin, getAdminStats);

router.post('/generate-invite-code', protect, isAdmin, generateInviteCode);

// ✅ Admin-only route to extend the user's account expiry date
// router.patch('/:id/extend-user-expiry', protect, isAdmin, extendUserExpiryDate);

module.exports = router;
