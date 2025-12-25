const express = require('express');
const router = express.Router();
const { protect, isAdmin ,isSuperAdmin} = require('../middlewares/auth');
const User = require('../models/user');
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
  extendUserExpiryDate,
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
  // res.json({
  //   _id: req.user._id,
  //   name: req.user.name,
  //   email: req.user.email,
  //   phone: req.user.phone,
  //   preferredVerificationMethod: req.user.preferredVerificationMethod,
  //   role: req.user.role,
  //   isVerified: req.user.isVerified,
  // });
  res.json(req.user);
});

router.get("/:email/getUserByEmail", protect, isAdmin, async (req, res) => {
  try {
    const email = req.params.email;
    // const user = await User.findById(req.params.id);
    const user = await User.findOne({email});
    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(401).json({ message: 'Invalid User email' });
    }
    if (!user.isVerified && user.role === "user") {
      return res.status(403).json({ message: `Please Make Sure That The User's Account Is Verified Before Attempting To Extend The Account's Expiry Date.` });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error while retrieving user data' });
  }
});

router.get("/:id/getUserById", protect, isAdmin, async (req, res) => {
  try {
    const ID = req.params.id;
    // const user = await User.findById(req.params.id);
    const user = await User.findById(ID);
    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(401).json({ message: 'Invalid User ID' });
    }
    // if (!user.isVerified && user.role === "user") {
    //   return res.status(403).json({ message: `Please Make Sure That The User's Account Is Verified Before Attempting To Extend The Account's Expiry Date.` });
    // }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error while retrieving user data' });
  }
});

// @route   POST /api/users/register
router.post('/register',authLimiter, registerUser);

//@route POST /api/users/verify-email
router.post('/verify-email',authLimiter, verifyAccount);

//@route POST /api/users/resend-verification-email
router.post('/resend-verification',authLimiter, resendVerificationOTP);

// @route   POST /api/users/login
router.post('/login',authLimiter, loginUser);

// Protected
router.post('/logout', protect, logoutUser); 

// @route   POST /api/users/forgot-password
router.post('/forgot-password',authLimiter, forgotPassword);

// @route   POST /api/users/reset-password
router.post('/reset-password',authLimiter, resetPassword);

// @route   GET /api/users/my-submissions
router.get('/my-submissions', protect, getMyDocuments);

// ✅ Admin-only route to get all user statistics
// return all Users
router.get('/stats', protect, isAdmin, getAllUserStats);

// 👇 Add this new route for admin stats
// return all admins
router.get('/admins', protect, isSuperAdmin, getAdminStats);

router.post('/generate-invite-code', protect, isAdmin, generateInviteCode);

// ✅ Admin-only route to extend the user's account expiry date
router.patch('/:id/extend-user-expiry', protect, isAdmin, extendUserExpiryDate);

module.exports = router;
