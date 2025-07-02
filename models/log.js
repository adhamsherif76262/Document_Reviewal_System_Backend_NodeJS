const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['login', 'logout', 'approve', 'reject' , 'register' ,'verifyEmail', 'forgotPassword', 'resetPassword', 'fileSubmission', 'fileReSubmission', 'GetAllPersonalDocs', 'GetAllUsersStats', 'GetAllAdminsStats'],
      required: true,
    },
    admin: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
      type: Object,
      default: null,
    },
    user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
      type: Object,
      default: null,
    },
    document: {
    //   type: mongoose.Schema.Types.ObjectId,
      type: Object,
    //   ref: 'Document',
    },
    message: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// ✅ Virtual field for actor (admin.name or user.name)
logSchema.virtual('actor').get(function () {
  if (this.admin && this.populated('admin') && this.admin.name) {
    return this.admin.name;
  }
  if (this.user && this.populated('user') && this.user.name) {
    return this.user.name;
  }
  return null;
});


// Denormalized indexes

// 📌 Needed to filter logs by admin (admin/user)
logSchema.index({ 'admin._id': 1 });
// 📌 Needed to filter logs by user (admin/user)
logSchema.index({ 'user._id': 1 });
// 📌 Logs filtered by action type
logSchema.index({ action: 1 });
// 📌 Sort logs by newest first
logSchema.index({ createdAt: -1 });
// 📌 Needed to filter logs by admin within a date range efficiently
logSchema.index({ 'admin._id': 1, createdAt: -1 });
// 📌 Needed to filter logs by user within a date range efficiently
logSchema.index({ 'user._id': 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
