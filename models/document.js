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

module.exports = mongoose.model('Document', documentSchema);
