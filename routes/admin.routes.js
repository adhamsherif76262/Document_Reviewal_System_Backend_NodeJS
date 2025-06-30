// routes/admin.routes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const User = require('../models/user');
const Document = require('../models/document');
const Review = require('../models/review');

// @route   GET /api/admin/metrics
// @desc    Admin dashboard metrics
// @access  Private (Admins only)
router.get('/metrics', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const totalReviews = await Review.countDocuments();

    const statusCounts = await Document.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {};
    statusCounts.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    res.json({
      totalUsers,
      totalDocuments,
      totalReviews,
      documentStatuses: {
        pending: statusMap.pending || 0,
        approved: statusMap.approved || 0,
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
router.get('/documents', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    // Extract filters and pagination from query
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.fileName = { $regex: search, $options: 'i' }; // case-insensitive search
    }

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
