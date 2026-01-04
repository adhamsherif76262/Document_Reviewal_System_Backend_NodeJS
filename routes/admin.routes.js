// routes/admin.routes.js

const express = require('express');
const router = express.Router();
const { protect , isAdmin, isSuperAdmin} = require('../middlewares/auth');
const User = require('../models/user');
const Document = require('../models/document');
const Review = require('../models/review');
const Log = require('../models/log');

// @route   GET /api/admin/metrics
// @desc    Admin dashboard metrics
// @access  Private (Admins only)
router.get('/metrics', protect,isAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalLogs = await Log.countDocuments();

    const reviewsCounts = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = await Document.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const usersStatusCounts = await User.aggregate([
      {
        $group: {
          _id: '$adminLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const logsActionsCounts = await Log.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    const logsActionsMap = {};
    logsActionsCounts.forEach(({ _id, count }) => {
      logsActionsMap[_id] = count;
    });

    const usersStatusMap = {};
    usersStatusCounts.forEach(({ _id, count }) => {
      usersStatusMap[_id] = count;
    });

    const statusMap = {};
    statusCounts.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });
    const reviewsMap = {};
    reviewsCounts.forEach(({ _id, count }) => {
      reviewsMap[_id] = count;
    });

    res.json({
      totalUsers,
      usersRoles:{
        regularUsers:usersStatusMap.null || 0,
        admins:usersStatusMap.regular || 0,
        superAdmins:usersStatusMap.super || 0
      },
      totalReviews,
      reviewsCount:{
        approved: reviewsMap.approved || 0,
        partiallyApproved: reviewsMap.partiallyApproved || 0,
        rejected: reviewsMap.rejected || 0
      },
      totalLogs,
      logsActionsCount : {
        login :logsActionsMap.login || 0,
        logout :logsActionsMap.logout || 0,
        register :logsActionsMap.register || 0,
        verifyEmail :logsActionsMap.verifyEmail || 0,
        forgotPassword :logsActionsMap.forgotPassword || 0,
        resetPassword :logsActionsMap.resetPassword || 0,
        fileSubmission :logsActionsMap.fileSubmission || 0,
        fileReSubmission :logsActionsMap.fileReSubmission || 0,
        approved :logsActionsMap.approved || 0,
        partiallyApproved :logsActionsMap.partiallyApproved || 0,
        rejected :logsActionsMap.rejected || 0,
        assign :logsActionsMap.assign || 0,
        reviewReturn :logsActionsMap.reviewReturn || 0,
        ListAllDocs :logsActionsMap.ListAllDocs || 0,
        GetAllReviews :logsActionsMap.GetAllReviews || 0,
        ExtendUserAccountExpiryDate :logsActionsMap.ExtendUserAccountExpiryDate || 0,
        GenerateRegistrationCode :logsActionsMap.GenerateRegistrationCode || 0,
        SyncDocTypeAssignments :logsActionsMap.SyncDocTypeAssignments || 0,
        GetDocTypeAssignments :logsActionsMap.GetDocTypeAssignments || 0,
        SubmitFinalCertificate :logsActionsMap.SubmitFinalCertificate || 0,
        ResubmitFinalCertificate :logsActionsMap.ResubmitFinalCertificate || 0,
        ApproveFinalCertificate :logsActionsMap.ApproveFinalCertificate || 0,
        RejectFinalCertificate :logsActionsMap.RejectFinalCertificate || 0,
        GetAllPersonalDocs :logsActionsMap.GetAllPersonalDocs || 0,
        GetAllUsersStats :logsActionsMap.GetAllUsersStats || 0,
        GetAllAdminsStats :logsActionsMap.GetAllAdminsStats || 0,
      },
      totalDocuments,
      documentStatuses: {
        pending: statusMap.pending || 0,
        approved: statusMap.approved || 0,
        partiallyApproved: statusMap.partiallyApproved || 0,
        rejected: statusMap.rejected || 0
      }
    });
  } catch (error) {
    console.error('Admin Metrics Error:', error.message);
    res.status(500).json({ message: 'Server error fetching admin metrics' });
  }
});


// @route   GET /api/admin/documents
// @desc    Admin view all documents with filters and pagination
// @access  Private (Admins only)
// Not Updated
router.get('/documents', protect,isAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    // Extract filters and pagination from query
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    if (status && ['pending', 'approved','partiallyApproved', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.fileName = { $regex: search, $options: 'i' }; // case-insensitive search
    }

        //  THESE POPULATE ORDERS PREVENT THE SYSTEM FROM RENDERING MORE THAN 375 LOGS PER PAGE & CAUSES SERVER ERRORS
    //  DURING THE PAGINATION NAVIGATION EITHER USING NEXT FOR LARGE LIMIT NUMBERS OR PREVIOUS FOR SMALL LIMIT NUMBERS 
    // & UNTILL NOW AFTER REMOVING THEM I HAVE TESTED MOST OF THE SCENARIOS OF RENDERING & EVERYTHING SEEMS SEAMLESS 
    // SO I WILL KEEP THEM OFFLINE
    
    const documents = await Document.find(query)
      .populate('user', 'name email') // Include uploader info
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      totalDocuments: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      documents
    });
  } catch (error) {
    console.error('Admin Paginated Docs Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching documents' });
  }
});


module.exports = router;
