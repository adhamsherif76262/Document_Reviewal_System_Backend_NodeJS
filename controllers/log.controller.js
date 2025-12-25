const Log = require('../models/log');
const User = require('../models/user');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

exports.getLogs = async (req, res) => {

  try {
    const {
      page = 1,
      limit = 100,
      // adminName,
      actor,
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
      filter.action = { $regex: `${action}`, $options: 'i' };
        console.log("valid Action Passed")
    }
    // else{
    //     logger.error("Invalid Action Passed")
    // }

    // 🗓️ Filter by date range
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // 🔍 Admin filter
    if (actor || adminEmail) {
  const orConditions = [];

  if (actor) {
    orConditions.push({ 'admin.name': { $regex: actor, $options: 'i' } });
    orConditions.push({ 'user.name': { $regex: actor, $options: 'i' } });
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


// Example input: actor and adminEmail are now expected to be ObjectId strings
// if (actor || adminEmail) {
//   const orConditions = [];

//   if (actor) {
//     // Match user or admin _id with the provided actor string
//     if (mongoose.Types.ObjectId.isValid(actor)) {
//       const actorId = new mongoose.Types.ObjectId(actor);
//       orConditions.push({ admin: actorId });
//       orConditions.push({ user: actorId });
//     }
//   }

//   if (adminEmail) {
//     // If adminEmail is actually an ID (e.g., passed from frontend)
//     if (mongoose.Types.ObjectId.isValid(adminEmail)) {
//       const adminId = new mongoose.Types.ObjectId(adminEmail);
//       orConditions.push({ admin: adminId });
//       orConditions.push({ user: adminId });
//     }
//   }

//   if (orConditions.length > 0) {
//     filter.$or = orConditions;
//   }
// }



// 🔍 Actor / adminEmail filter
// const orConditions = [];

// if (actor && mongoose.Types.ObjectId.isValid(actor)) {
//   const actorId = new mongoose.Types.ObjectId(actor);
//   orConditions.push({ admin: actorId });
//   orConditions.push({ user: actorId });
// }

// if (adminEmail && mongoose.Types.ObjectId.isValid(adminEmail)) {
//   const adminId = new mongoose.Types.ObjectId(adminEmail);
//   orConditions.push({ admin: adminId });
//   orConditions.push({ user: adminId });
// }

// if (orConditions.length > 0) {
//   // Combine $or with other filters via $and
//   filter.$and = [
//     { $or: orConditions },
//     // any other top-level filters can be merged here if needed
//   ];
// }

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

// const Log = require('../models/log');
// const logger = require('../utils/logger');

// exports.getLogs = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       adminName,
//       adminEmail,
//       userName,
//       userEmail,
//       action,
//       startDate,
//       endDate,
//       docNumber,
//       docType,
//       state,
//       status,
//     } = req.query;

//     const skip = (page - 1) * limit;

//     // 🔧 Build filter for Log-level fields
//     const matchStage = {};

//     // 🎯 Filter by action
//     if (action) {
//       matchStage.action = { $regex: `^${action}$`, $options: 'i' };
//       console.log('Valid action passed');
//     }

//     // 🗓️ Filter by date range
//     if (startDate || endDate) {
//       matchStage.timestamp = {};
//       if (startDate) matchStage.timestamp.$gte = new Date(startDate);
//       if (endDate) matchStage.timestamp.$lte = new Date(endDate);
//     }

//     // 🔍 Filter by user/admin names/emails
//     const orConditions = [];
//     if (adminName) {
//       orConditions.push({ 'admin.name': { $regex: adminName, $options: 'i' } });
//       orConditions.push({ 'user.name': { $regex: adminName, $options: 'i' } });
//     }
//     if (adminEmail) {
//       orConditions.push({ 'admin.email': { $regex: adminEmail, $options: 'i' } });
//       orConditions.push({ 'user.email': { $regex: adminEmail, $options: 'i' } });
//     }
//     if (orConditions.length > 0) matchStage.$or = orConditions;

//     if (userName) matchStage['user.name'] = { $regex: userName, $options: 'i' };
//     if (userEmail) matchStage['user.email'] = { $regex: userEmail, $options: 'i' };

//     // 🧱 Build aggregation pipeline
//     const pipeline = [
//       // Join related document
//       {
//         $lookup: {
//           from: 'documents',
//           localField: 'document',
//           foreignField: '_id',
//           as: 'document',
//         },
//       },
//       { $unwind: { path: '$document', preserveNullAndEmptyArrays: true } },

//       // Join related admin
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'admin',
//           foreignField: '_id',
//           as: 'admin',
//         },
//       },
//       { $unwind: { path: '$admin', preserveNullAndEmptyArrays: true } },

//       // Join related user
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'user',
//           foreignField: '_id',
//           as: 'user',
//         },
//       },
//       { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

//       // Match logs (general filters)
//       { $match: matchStage },
//     ];

//     // 🧾 Add optional document-based filters
//     const docFilters = {};
//     if (docNumber) docFilters['document.docNumber'] = { $regex: docNumber, $options: 'i' };
//     if (docType) docFilters['document.docType'] = { $regex: docType, $options: 'i' };
//     if (state) docFilters['document.state'] = { $regex: state, $options: 'i' };
//     if (status) docFilters['document.status'] = { $regex: status, $options: 'i' };

//     if (Object.keys(docFilters).length > 0) pipeline.push({ $match: docFilters });

//     // 🧮 Count total before pagination
//     const totalPipeline = [...pipeline, { $count: 'total' }];
//     const totalResult = await Log.aggregate(totalPipeline);
//     const total = totalResult[0]?.total || 0;

//     // 📄 Pagination + sorting
//     pipeline.push(
//       { $sort: { timestamp: -1 } },
//       { $skip: skip },
//       { $limit: Number(limit) },
//       // Only project what we need
//       {
//         $project: {
//           action: 1,
//           timestamp: 1,
//           message: 1,
//           'admin._id': 1,
//           'admin.name': 1,
//           'admin.email': 1,
//           'user._id': 1,
//           'user.name': 1,
//           'user.email': 1,
//           'document._id': 1,
//           'document.docNumber': 1,
//           'document.docType': 1,
//           'document.state': 1,
//           'document.status': 1,
//         },
//       }
//     );

//     const logs = await Log.aggregate(pipeline);

//     res.status(200).json({
//       success: true,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / limit),
//       count: logs.length,
//       logs,
//     });
//   } catch (error) {
//     logger.error('Log Fetch Error:', error.message);
//     res.status(500).json({ message: 'Failed to fetch logs' });
//   }
// };

