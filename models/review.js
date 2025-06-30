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

module.exports = mongoose.model('Review', reviewSchema);
