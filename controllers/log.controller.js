const Log = require('../models/log');
const User = require('../models/user');
const logger = require('../utils/logger');

exports.getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      adminName,
      adminEmail,
      userName,
      userEmail,
      action,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // 🎯 Filter by action
    if (action) {
      filter.action = { $regex: `^${action}$`, $options: 'i' };
        console.log("valid Action Passed")
    }
    else{
        logger.error("Invalid Action Passed")
    }

    // 🗓️ Filter by date range
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // 🔍 Admin filter
    if (adminName || adminEmail) {
  const orConditions = [];

  if (adminName) {
    orConditions.push({ 'admin.name': { $regex: adminName, $options: 'i' } });
    orConditions.push({ 'user.name': { $regex: adminName, $options: 'i' } });
  }

  if (adminEmail) {
    orConditions.push({ 'admin.email': { $regex: adminEmail, $options: 'i' } });
    orConditions.push({ 'user.email': { $regex: adminEmail, $options: 'i' } });
  }

  // Add the $or to the main filter
  if (orConditions.length > 0) {
    filter.$or = orConditions;
  }
}


    // 🔍 User filter (for denormalized user object)
    if (userName) {
      filter['user.name'] = { $regex: userName, $options: 'i' };
    }
    if (userEmail) {
      filter['user.email'] = { $regex: userEmail, $options: 'i' };
    }


    // 🧾 Fetch logs
    const logs = await Log.find(filter)
      .populate('admin', 'name email')
      .populate('user', 'name email')
      .populate('document', 'fileName fileUrl status')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Log.countDocuments(filter);

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    logger.error('Log Fetch Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
};
