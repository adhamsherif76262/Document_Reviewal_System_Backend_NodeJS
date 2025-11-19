const Review = require('../models/review');
const User = require('../models/user');
const logger = require('../utils/logger');
const Log = require('../models/log'); // make sure this is at the top
const mongoose = require('mongoose');

// exports.getAdminReviews = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       docNumber,
//       fieldReviewedKey,
//       fieldReviewedStatus,
//       docType,
//       state,
//       adminName,
//       adminEmail,
//       status,
//       startDate,
//       endDate,
//     } = req.query;

//     // 🔹 1. Build admin filter
//     const adminQuery = {};
//     if (adminName) adminQuery.name = { $regex: adminName, $options: 'i' };
//     if (adminEmail) adminQuery.email = { $regex: adminEmail, $options: 'i' };
//     if (Object.keys(adminQuery).length > 0) adminQuery.role = 'admin';

//     let matchingAdminIds = [];
//     if (Object.keys(adminQuery).length > 0) {
//       const admins = await User.find(adminQuery).select('_id');
//       matchingAdminIds = admins.map(a => a._id);
//     }

//     // 🔹 2. Build document filter (for docType, docNumber, state)
//     let matchingDocumentIds = [];
//     if (docType || docNumber || state) {
//       const docFilter = {};
//       if (docType) docFilter.docType = { $regex: docType, $options: 'i' };
//       if (docNumber) docFilter.docNumber = { $regex: docNumber, $options: 'i' };
//       if (state) docFilter.state = { $regex: state, $options: 'i' };

//       const docs = await Document.find(docFilter).select('_id');
//       matchingDocumentIds = docs.map(d => d._id);
//     }

//     // 🔹 3. Build main review filter
//     const reviewFilter = {};
//     if (status) reviewFilter.status = status;
//     if (fieldReviewedKey)
//       reviewFilter.fieldReviewedKey = { $regex: fieldReviewedKey, $options: 'i' };
//     if (fieldReviewedStatus)
//       reviewFilter.fieldReviewedStatus = { $regex: fieldReviewedStatus, $options: 'i' };

//     if (matchingAdminIds.length > 0)
//       reviewFilter.reviewedBy = { $in: matchingAdminIds };
//     if (matchingDocumentIds.length > 0)
//       reviewFilter.document = { $in: matchingDocumentIds };

//     if (startDate || endDate) {
//       reviewFilter.createdAt = {};
//       if (startDate) reviewFilter.createdAt.$gte = new Date(startDate);
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         reviewFilter.createdAt.$lte = end;
//       }
//     }

//     // 🔹 4. Pagination & sorting
//     const skip = (Number(page) - 1) * Number(limit);

//     const total = await Review.countDocuments(reviewFilter);

//     const reviews = await Review.find(reviewFilter)
//       .populate('reviewedBy', 'name email')
//       .populate('document', '-__v -updatedAt')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     // 🔹 5. Log action
//     await Log.create({
//       action: 'GetAllReviews',
//       admin: req.user,
//         message: `Admin ${req.user.name} With Email ${req.user.email} Attempted To View The Reviews list.`,
//     });

//     res.status(200).json({
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / limit),
//       reviews,
//     });
//   } catch (error) {
//     logger.error('Error fetching admin reviews:', error.message);
//     res.status(500).json({ message: 'Server error while fetching reviews' });
//   }
// };


// exports.getAdminReviews = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       docNumber,
//       fieldReviewedKey,
//       fieldReviewedStatus,
//       docType,
//       state,
//       adminName,
//       adminEmail,
//       status,
//       startDate,
//       endDate,
//     } = req.query;

//     // 🔹 1. Admin filter
//     const adminFilter = {};
//     if (adminName) adminFilter.name = { $regex: adminName, $options: 'i' };
//     if (adminEmail) adminFilter.email = { $regex: adminEmail, $options: 'i' };

//     let matchingAdminIds = [];
//     if (Object.keys(adminFilter).length > 0) {
//       adminFilter.role = 'admin';
//       const admins = await User.find(adminFilter).select('_id');
//       matchingAdminIds = admins.map((a) => a._id);
//     }

//     // 🔹 2. Review filter
//     const reviewFilter = {};

//     if (status) reviewFilter.status = status;
//     if (fieldReviewedKey) reviewFilter['fieldsReviewed.fieldKey'] = { $regex: fieldReviewedKey, $options: 'i' };
//     if (fieldReviewedStatus) reviewFilter['fieldsReviewed.status'] = fieldReviewedStatus;

//     // 🔹 3. Date range
//     if (startDate || endDate) {
//       reviewFilter.createdAt = {};
//       if (startDate) reviewFilter.createdAt.$gte = new Date(startDate);
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         reviewFilter.createdAt.$lte = end;
//       }
//     }

//     // 🔹 4. Match admin IDs
//     if (matchingAdminIds.length > 0) {
//       reviewFilter.reviewedBy = { $in: matchingAdminIds };
//     }

//     // // 🔹 5. Add document-based filters (through populate + match)
//     // const documentMatch = {};
//     // if (docType) documentMatch.docType = { $regex: docType, $options: 'i' };
//     // if (docNumber) documentMatch.docNumber = { $regex: docNumber, $options: 'i' };
//     // if (state) documentMatch.state = { $regex: state, $options: 'i' };

//     // // 🔹 6. Pagination
//     // const skip = (Number(page) - 1) * Number(limit);

//     // // 🔹 7. Query Reviews
//     // const total = await Review.countDocuments(reviewFilter);

//     // const reviews = await Review.find(reviewFilter)
//     //   .populate({
//     //     path: 'reviewedBy',
//     //     select: 'name email',
//     //   })
//     //   .populate({
//     //     path: 'document',
//     //     match: documentMatch, // 👈 filter docs here
//     //     select: '-__v -updatedAt',
//     //   })
//     //   .sort({ createdAt: -1 })
//     //   .skip(skip)
//     //   .limit(Number(limit));

//     // // 🔹 8. Remove null documents (filtered out by populate match)
//     // const filteredReviews = reviews.filter(r => r.document);

//     // await Log.create({
//     //   action: 'GetAllReviews',
//     //   admin: req.user,
//     //   message: `Admin ${req.user.name} with email ${req.user.email} viewed document list.`,
//     // });

//     // res.status(200).json({
//     //   total: filteredReviews.length,
//     //   page: Number(page),
//     //   pages: Math.ceil(total / limit),
//     //   reviews: filteredReviews,
//     // });
// // 🔹 5. Add document-based filters (through populate + match)
// const documentMatch = {};
// if (docType) documentMatch.docType = { $regex: docType, $options: 'i' };
// if (docNumber) documentMatch.docNumber = { $regex: docNumber, $options: 'i' };
// if (state) documentMatch.state = { $regex: state, $options: 'i' };

// // 🔹 6. Pagination
// const skip = (Number(page) - 1) * Number(limit);

// // 🔹 7. Query Reviews (populate + document match)
// let reviews = await Review.find(reviewFilter)
//   .populate({
//     path: 'reviewedBy',
//     select: 'name email',
//   })
//   .populate({
//     path: 'document',
//     match: documentMatch,
//     select: '-__v -updatedAt',
//   })
//   .sort({ createdAt: -1 })
//   .skip(skip)
//   .limit(Number(limit))
//   .lean(); // optional but improves speed

// // 🔹 8. Filter out reviews where document didn’t match
// reviews = reviews.filter(r => r.document);

// // 🔹 9. Count total *accurately* (apply same logic)
// const total = await Review.countDocuments(reviewFilter);
// const filteredCount = reviews.length; // since populate match can reduce it

// await Log.create({
//   action: 'GetAllReviews',
//   admin: req.user,
//   message: `Admin ${req.user.name} with email ${req.user.email} viewed filtered reviews.`,
// });

// res.status(200).json({
//   total: filteredCount,
//   page: Number(page),
//   pages: Math.ceil(filteredCount / limit),
//   reviews,
// });

//   } catch (error) {
//     console.error('❌ Error fetching admin reviews:', error);
//     logger.error('Error fetching admin reviews:', error.message);
//     res.status(500).json({ message: 'Server error while fetching reviews' });
//   }
// };



// exports.getAdminReviews = async (req, res) => {
//   try {
//     const {
//       docNumber,
//       docType,
//       state,
//       fieldReviewedKey,
//       fieldReviewedStatus,
//       adminId,
//     } = req.query;

//     // Build match stage for reviews (top-level filters)
//     const reviewMatch = {};
//     if (fieldReviewedKey)
//       reviewMatch['fieldsReviewed.fieldKey'] = { $regex: fieldReviewedKey, $options: 'i' };
//     if (fieldReviewedStatus)
//       reviewMatch['fieldsReviewed.status'] = { $regex: fieldReviewedStatus, $options: 'i' };
//     if (adminId)
//       reviewMatch.admin = new mongoose.Types.ObjectId(adminId);

//     // Build match for joined document filters
//     const documentMatch = {};
//     if (docNumber)
//       documentMatch.docNumber = { $regex: docNumber, $options: 'i' };
//     if (docType)
//       documentMatch.docType = { $regex: docType, $options: 'i' };
//     if (state)
//       documentMatch.state = { $regex: state, $options: 'i' };

//     // Aggregate pipeline
//     const pipeline = [
//       { $match: reviewMatch },

//       // Join with Document collection
//       {
//         $lookup: {
//           from: 'documents',
//           localField: 'document',
//           foreignField: '_id',
//           as: 'document',
//         },
//       },
//       { $unwind: '$document' },

//       // Apply filters based on joined document fields
//       { $match: { 'document': documentMatch } },

//       // Optionally project only needed fields
//       {
//         $project: {
//           _id: 1,
//           admin: 1,
//           createdAt: 1,
//           'fieldsReviewed': 1,
//           'document._id': 1,
//           'document.docNumber': 1,
//           'document.docType': 1,
//           'document.state': 1,
//           'document.status': 1,
//         },
//       },

//       { $sort: { createdAt: -1 } },
//     ];

//     const reviews = await Review.aggregate(pipeline);

//     res.status(200).json({ success: true, count: reviews.length, reviews });
//   } catch (error) {
//     console.error('❌ getReviews error:', error);
//     res.status(500).json({
//       message: 'Server error while fetching reviews',
//       error: error.message,
//     });
//   }
// };

// controllers/reviewController.js
// import mongoose from 'mongoose';
// import Review from '../models/Review.js';

// exports.getAdminReviews = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       sortBy = 'createdAt',
//       sortOrder = 'desc',
//       docNumber,
//       docType,
//       state,
//       fieldReviewedKey,
//       fieldReviewedStatus,
//       adminId,
//     } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // 🔹 1. Review-level match
//     const reviewMatch = {};
//     if (fieldReviewedKey)
//       reviewMatch['fieldsReviewed.fieldKey'] = { $regex: fieldReviewedKey, $options: 'i' };
//     if (fieldReviewedStatus)
//       reviewMatch['fieldsReviewed.status'] = { $regex: fieldReviewedStatus, $options: 'i' };
//     if (adminId)
//       reviewMatch.admin = new mongoose.Types.ObjectId(adminId);

//     // 🔹 2. Document-level match (applied after lookup)
//     const documentMatch = {};
//     if (docNumber)
//       documentMatch.docNumber = { $regex: docNumber, $options: 'i' };
//     if (docType)
//       documentMatch.docType = { $regex: docType, $options: 'i' };
//     if (state)
//       documentMatch.state = { $regex: state, $options: 'i' };

//     // 🔹 3. Sort object
//     const sortStage = {};
//     sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

//     // 🔹 4. Pipeline
//     const pipeline = [
//       { $match: reviewMatch },

//       // Join document data
//       {
//         $lookup: {
//           from: 'documents',
//           localField: 'document',
//           foreignField: '_id',
//           as: 'document',
//         },
//       },
//       { $unwind: '$document' },

//       // Apply filters on joined document
//       { $match: documentMatch && Object.keys(documentMatch).length > 0 ? { 'document': documentMatch } : {} },

//       // Optionally join admin info (if you have an Admin collection)
//       {
//         $lookup: {
//           from: 'users', // adjust if your admin collection is named differently
//           localField: 'admin',
//           foreignField: '_id',
//           as: 'adminInfo',
//         },
//       },
//       { $unwind: { path: '$adminInfo', preserveNullAndEmptyArrays: true } },

//       // Projection for clean output
//       {
//         $project: {
//           _id: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           'fieldsReviewed': 1,

//           // Document info
//           'document._id': 1,
//           'document.docNumber': 1,
//           'document.docType': 1,
//           'document.state': 1,
//           'document.status': 1,
//           'document.user._id': 1,
//           'document.user.name': 1,
//           'document.user.email': 1,

//           // Admin info
//           'adminInfo._id': 1,
//           'adminInfo.name': 1,
//           'adminInfo.email': 1,
//         },
//       },

//       // Sort & paginate
//       { $sort: sortStage },
//       { $skip: skip },
//       { $limit: parseInt(limit) },
//     ];

//     // 🔹 5. Execute aggregation
//     const reviews = await Review.aggregate(pipeline);

//     // 🔹 6. Count total (for pagination)
//     const totalCountPipeline = [
//       { $match: reviewMatch },
//       {
//         $lookup: {
//           from: 'documents',
//           localField: 'document',
//           foreignField: '_id',
//           as: 'document',
//         },
//       },
//       { $unwind: '$document' },
//       { $match: documentMatch && Object.keys(documentMatch).length > 0 ? { 'document': documentMatch } : {} },
//       { $count: 'total' },
//     ];
//     const totalCountResult = await Review.aggregate(totalCountPipeline);
//     const total = totalCountResult[0]?.total || 0;

//     // 🔹 7. Send Response
//     res.status(200).json({
//       success: true,
//       count: reviews.length,
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / parseInt(limit)),
//       reviews,
//     });
//   } catch (error) {
//     console.error('❌ getReviews error:', error);
//     res.status(500).json({
//       message: 'Server error while fetching reviews',
//       error: error.message,
//     });
//   }
// };

// exports.getAdminReviews = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       docNumber,
//       fieldReviewedKey,
//       fieldReviewedStatus,
//       docType,
//       state,
//       adminName,
//       adminEmail,
//       status,
//       startDate,
//       endDate,
//     } = req.query;

//     const filter = {};

//     // 🔹 1. Document-based filters (direct since denormalized)
//     if (docType) filter.docType = { $regex: docType, $options: 'i' };
//     if (docNumber) filter.docNumber = { $regex: docNumber, $options: 'i' };
//     if (state) filter.state = { $regex: state, $options: 'i' };

//     // 🔹 2. Review status filter
//     if (status) filter.status = status;

//     // 🔹 3. Admin (reviewer) filters — from denormalized reviewedBy object
//     if (adminName) filter['reviewedBy.name'] = { $regex: adminName, $options: 'i' };
//     if (adminEmail) filter['reviewedBy.email'] = { $regex: adminEmail, $options: 'i' };

//     // 🔹 4. Field-level filters (array of subdocs)
//     if (fieldReviewedKey || fieldReviewedStatus) {
//       filter.fieldsReviewed = {};
//       if (fieldReviewedKey)
//         filter.fieldsReviewed.fieldKey = { $regex: fieldReviewedKey, $options: 'i' };
//       if (fieldReviewedStatus)
//         filter.fieldsReviewed.status = { $regex: fieldReviewedStatus, $options: 'i' };
//     }

//     // 🔹 5. Date range filter
//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) filter.createdAt.$gte = new Date(startDate);
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         filter.createdAt.$lte = end;
//       }
//     }

//     // 🔹 6. Pagination
//     const skip = (Number(page) - 1) * Number(limit);

//     // 🔹 7. Query Reviews
//     const total = await Review.countDocuments(filter);

//     const reviews = await Review.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     // 🔹 8. Log admin action
//     await Log.create({
//       action: 'GetAllReviews',
//       admin: req.user,
//       message: `Admin ${req.user.name} (${req.user.email}) viewed review list.`,
//     });

//     // 🔹 9. Return response
//     res.status(200).json({
//       success: true,
//       total,
//       count: reviews.length,
//       page: Number(page),
//       pages: Math.ceil(total / limit),
//       reviews,
//     });
//   } catch (error) {
//     console.error('Error fetching admin reviews:', error);
//     logger.error('Error fetching admin reviews:', error.message);
//     res.status(500).json({ message: 'Server error while fetching reviews' });
//   }
// };


exports.getAdminReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      fieldReviewedKey,
      fieldReviewedStatus,
      docNumber,
      docType,
      state,
      status,
      adminName,
      adminEmail,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // 🔹 1. Document-level filters
    if (docType) filter.docType = { $regex: docType, $options: 'i' };
    if (docNumber) filter.docNumber = { $regex: docNumber, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };

    // 🔹 2. Overall review status
    if (status) filter.status = status;

    // 🔹 3. Reviewer filters (denormalized)
    if (adminName) filter['reviewedBy.name'] = { $regex: adminName, $options: 'i' };
    if (adminEmail) filter['reviewedBy.email'] = { $regex: adminEmail, $options: 'i' };

    // 🔹 4. Field-level filters using $elemMatch
    if (fieldReviewedKey || fieldReviewedStatus) {
      filter.fieldsReviewed = {
        $elemMatch: {},
      };
      if (fieldReviewedKey)
        filter.fieldsReviewed.$elemMatch.fieldKey = { $regex: fieldReviewedKey, $options: 'i' };
      if (fieldReviewedStatus)
        filter.fieldsReviewed.$elemMatch.status = { $regex: fieldReviewedStatus, $options: 'i' };
    }

    // 🔹 5. Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 🔹 6. Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 🔹 7. Fetch and count
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 🔹 8. Log admin action
    await Log.create({
      action: 'GetAllReviews',
      admin: req.user,
      message: `Admin ${req.user.name} (${req.user.email}) viewed review list.`,
    });

    // 🔹 9. Response
    res.status(200).json({
      success: true,
      total,
      count: reviews.length,
      page: Number(page),
      pages: Math.ceil(total / limit),
      reviews,
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    logger.error('Error fetching admin reviews:', error.message);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
};

