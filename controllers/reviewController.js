const Review = require('../models/review');
const User = require('../models/user');
const logger = require('../utils/logger');

exports.getAdminReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      adminName,
      adminEmail,
      status,
      startDate,
      endDate,
    } = req.query;

    const adminQuery = {};
    if (adminName) adminQuery.name = { $regex: adminName, $options: 'i' };
    if (adminEmail) adminQuery.email = { $regex: adminEmail, $options: 'i' };
    if (Object.keys(adminQuery).length > 0) {
      adminQuery.role = 'admin';
    }

    let matchingAdminIds = [];
    if (Object.keys(adminQuery).length > 0) {
      const admins = await User.find(adminQuery).select('_id');
      matchingAdminIds = admins.map((admin) => admin._id);
    }

    const reviewFilter = {};
    if (status) {
      reviewFilter.status = status;
    }

    if (startDate || endDate) {
      reviewFilter.createdAt = {};
      if (startDate) reviewFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        reviewFilter.createdAt.$lte = end;
      }
    }

    if (matchingAdminIds.length > 0) {
      reviewFilter.reviewedBy = { $in: matchingAdminIds };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Review.countDocuments(reviewFilter);

    const reviews = await Review.find(reviewFilter)
      .populate('reviewedBy', 'name email')
      .populate('document', '-__v -updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      reviews,
    });
  } catch (error) {
    logger.error('Error fetching admin reviews:', error.message);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
};
