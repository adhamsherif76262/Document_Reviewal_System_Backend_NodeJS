// models/document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: 'User', // Reference to the User model
      type : Object,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComment: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);


// Denormalized indexes

// 📌 Query documents by user (e.g. user’s history)
documentSchema.index({ 'user._id': 1 });
// 📌 Common admin filtering: "Show all pending documents"
documentSchema.index({ status: 1 });
// 📌 Needed for sorting by most recent (especially in dashboard)
documentSchema.index({ createdAt: -1 });
// 📌 Efficient filtering per user + status (e.g. “Adham’s approved documents”)
documentSchema.index({ 'user._id': 1, status: 1 });

module.exports = mongoose.model('Document', documentSchema);
