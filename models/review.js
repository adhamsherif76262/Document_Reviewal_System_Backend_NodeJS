// models/review.js
const mongoose = require('mongoose');

const fieldReviewSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    status: { type: String, enum: ['approved', 'rejected' , 'pending'], required: true },
    comment: { type: String },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    // Denormalized document reference
    document: {
      type: Object, // { _id, docNumber, docType, state }
      required: true,
    },

    // Denormalized reviewer snapshot
    reviewedBy: {
      type: Object, // { _id, name, email, role, adminLevel }
      required: true,
    },

    // For fast search & indexing
    docNumber: {
      type: String,
      required: true,
      index: true,
    },
  docType: {
    type: String,
    enum: [
      'Domestic Organic Pesticide',
      'Imported Organic Pesticide',
      'Domestic Organic Nutrition',
      'Imported Organic Nutrition',
      'Organic Farm',
      'Exporters Organic Production',
      'Importers Organic Production',
      'Warehouse',
      'Factory Or Production Unit',
      'Conformity Office Or Entity',
      'Consultancy Firms Or Scientific Offices',
      'Organic Feed Logo',
      'Under_Development_1',
      'Under_Development_2',
      'Under_Development_3',
    ], // adjust as needed
    required: true
  },

  state: {
    type: String,
    enum: ['Domestic', 'Imported' ,'General'],
    default: 'General',
    required: true
  },
    // Field-level review info (optional)
    fieldsReviewed: [fieldReviewSchema],

    // Overall review status
    status: {
      type: String,
      enum: ['approved', 'rejected', 'partiallyApproved'],
      required: true,
    },

    // General notes on the review
    comment: {
      type: String,
    },

    // Capture custody info during review for traceability
    custodyAtReview: {
      type: Object, // { _id, name, email, role, adminLevel }
    },
  },
  {
    timestamps: true,
  }
);
// 📌 Retrieve all reviews for a document (document history)
reviewSchema.index({ 'document._id': 1 });
// 📌 Filter admin activity (which reviews this admin handled)
reviewSchema.index({ 'reviewedBy._id': 1 });
// 📌 For filtering + sorting: Show latest “rejected” reviews, etc.
reviewSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);

// const reviewSchema = new mongoose.Schema(
//   {
//     document: {
//       // type: mongoose.Schema.Types.ObjectId,
//       // ref: 'Document',
//       type : Object,
//       required: true,
//     },
//     reviewedBy: {
//       // type: mongoose.Schema.Types.ObjectId,
//       // ref: 'User',
//       type: Object,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['approved', 'rejected'],
//       required: true,
//     },
//     comment: {
//       type: String,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// Denormalized indexes







