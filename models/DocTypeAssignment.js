// models/DocTypeAssignment.js
const mongoose = require('mongoose');

const docTypeAssignmentSchema = new mongoose.Schema(
  {
    docType: { type: String, required: true, unique: true },
    assignedAdmins: [{ type:Object}],
  },
  { timestamps: true }
);
module.exports = mongoose.model('DocTypeAssignment', docTypeAssignmentSchema);