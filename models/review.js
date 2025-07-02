// models/review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    document: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: 'Document',
      type : Object,
      required: true,
    },
    reviewedBy: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: 'User',
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Denormalized indexes

// 📌 Retrieve all reviews for a document (document history)
reviewSchema.index({ 'document._id': 1 });
// 📌 Filter admin activity (which reviews this admin handled)
reviewSchema.index({ 'reviewedBy._id': 1 });
// 📌 For filtering + sorting: Show latest “rejected” reviews, etc.
reviewSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
