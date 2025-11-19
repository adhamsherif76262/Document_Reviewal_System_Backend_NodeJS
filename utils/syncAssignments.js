// const DocTypeAssignment = require('../models/docTypeAssignment');
const DocTypeAssignment = require ('../models/DocTypeAssignment');

const Document = require('../models/document');

// 🔄 Sync all documents of a given docType with the latest assignments
exports.syncDocAssignments = async (docType) => {
  try {
    const assignment = await DocTypeAssignment.findOne({ docType });
    if (!assignment) return;

    // const adminIds = assignment.assignedAdmins.map(a => a._id);

    const result = await Document.updateMany(
      { docType },
      { $set: { assignedAdmins: assignment.assignedAdmins } }
    //   { $set: { assignedAdmins: adminIds } }
    );
    console.log(`✅ Synced ${result.modifiedCount} documents for docType: ${docType}`);
    return result
  } catch (err) {
    console.error('❌ Error syncing document assignments:', err.message);
  }
};
