const mongoose = require('mongoose');

const inviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  generatedBy: { type: Object},
  generatedFor: { type: String , required:true}, // optional: store intended email/company
  status: { type: String, enum: ['unused', 'used'], default: 'unused' },
  usedBy: { type: Object},
  createdAt: { type: Date, default: Date.now },
  usedAt: { type: Date },
});
inviteCodeSchema.index({ generatedFor: 1, used: 1 }); // for faster lookups

module.exports = mongoose.model('InviteCode', inviteCodeSchema);