const express = require('express');
const router = express.Router();
const { protect, isAdmin ,isSuperAdmin} = require('../middlewares/auth');
const User = require('../models/user');
const Document = require('../models/document');

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
          if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all documents' });
    }

    const {
      docType,
      docNumber,
      currentHolderName,
      state,
      hasPendingResubmission,
      status,
      certificateStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {'user._id': user._id};
    // const filter = {};

    // 🔍 1. Basic filters
    if (status) filter.status = status;
    if (docType) filter.docType = { $regex: docType, $options: 'i' };
    if (docNumber) filter.docNumber = { $regex: docNumber, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };

    // 👤 3. Filter by current holder details
    if (currentHolderName) filter['custody.currentHolder.name'] = { $regex: currentHolderName, $options: 'i' };

    // 📄 4. Filter by Final Certificate Status
    if (certificateStatus) filter['certificate.status'] = { $regex: certificateStatus, $options: 'i' };

    // ⏳ 5. Filter by "hasPendingResubmission" (boolean)
    if (typeof hasPendingResubmission !== 'undefined') {
      const value = hasPendingResubmission === 'true' || hasPendingResubmission === true;
      filter.hasPendingResubmission = value;
    }

    // 📅 6. Date range filter (createdAt)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full day
        filter.createdAt.$lte = end;
      }
    }

    // 🧩 Restrict regular admins to only assigned docs
    if (req.user.role === 'admin' && req.user.adminLevel === 'regular') {
      filter['assignedAdmins._id'] = req.user._id; // If The assignedAdmins array is an array of objects
      // filter.assignedAdmins = { $in: [req.user.email] }; ==> If The assignedAdmins array is just an array of strings
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalDocuments = await Document.countDocuments(filter);
        
    const documents = await Document.find(filter)
    .select({
      docType: 1,
      docNumber: 1,
      state: 1,
      status: 1,
      hasPendingResubmission: 1,
      adminComment: 1,
      submittedAt: 1,
      lastReviewedAt: 1,
      'certificate.status': 1,
      'custody.currentHolder.name': 1,
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const allDocsForCounts = await Document.find({'user._id': user._id}).select('status');

    const pendingCount = allDocsForCounts.filter(d => d.status === 'pending').length;
    const approvedCount = allDocsForCounts.filter(d => d.status === 'approved').length;
    const partiallyApprovedCount = allDocsForCounts.filter(d => d.status === 'partiallyApproved').length;
    const rejectedCount = allDocsForCounts.filter(d => d.status === 'rejected').length;

    // const pendingCount = documents.filter((doc) => doc.status === 'pending');
    // const approvedCount = documents.filter((doc) => doc.status === 'approved');
    // const partiallyApprovedCount = documents.filter((doc) => doc.status === 'partiallyApproved');
    // const rejectedCount = documents.filter((doc) => doc.status === 'rejected')
        
    // const totalDocuments = documents.length
      
    return res.status(200).json({
      // user,
      // totalDocuments: documents.length,
      // pendingCount: pending.length,
      // approvedCount: approved.length,
      // partiallyApprovedCount: partiallyApproved.length,
      // rejectedCount: rejected.length,
      // pendingDocuments: pending,
      // approvedDocuments: approved,
      // partiallyApprovedDocuments: partiallyApproved,
      // rejectedDocuments: rejected,
      pagination: {
        totalDocuments,
        pages: Math.ceil(totalDocuments / limit),
        page: parseInt(page),
      },
      user,
      pendingCount,
      approvedCount,
      partiallyApprovedCount,
      rejectedCount,
      documents
    });
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
