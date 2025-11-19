// controllers/assignmentController.js
const {refreshDocTypeAssignments} = require('../utils/refreshDocTypeAssignments');
const {syncDocAssignments} = require('../utils/syncAssignments');
const DocTypeAssignment = require('../models/DocTypeAssignment');
const Log = require('../models/log');
const { docTypeAssignments } = require('../Config/docTypeAssignments');

// 🟢 Manually trigger a re-sync
exports.syncDocTypeAssignments = async (req, res) => {
  try {
    const updated = await refreshDocTypeAssignments();
    // const updated2 = await syncDocAssignments();
    // const updated2 = await (async () => {
    //   const assignments = await DocTypeAssignment.find();
    //   for (const a of assignments) {
    //     await syncDocAssignments(a.docType);
    //   }
    // })();
        // Step 2: Sync all existing documents to match the new assignments
    const updated2 = await (async () => {
      const assignments = await DocTypeAssignment.find();
      const results = [];

      for (const a of assignments) {
        const result = await syncDocAssignments(a.docType);
        results.push({
          docType: a.docType,
          syncedCount: result.modifiedCount || 0,
        });
      }

      return results;
    })();
        // 🧾 Log action
    await Log.create({
      action: 'SyncDocTypeAssignments',
      admin : req.user,
      message: `Super Admin ${req.user.name} with email ${req.user.email} Attempted To Sync All Document Type Assignments.`,
    });
    res.status(200).json({
      message: 'DocType assignments refreshed successfully',
      Updates:{
        DocTypeAssignmentsCollection: updated,
        DocsCollection: updated2
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error syncing assignments', error: err.message });
  }
};

// 🟡 View all current assignments
exports.getDocTypeAssignments = async (req, res) => {
  try {
    const assignments = await DocTypeAssignment.find().populate('assignedAdmins', 'name email');
// 🧾 Log action
    await Log.create({
      action: 'GetDocTypeAssignments',
      admin : req.user,
      message: `Super Admin ${req.user.name} with email ${req.user.email} Attempted View All Document Type Assignments.`,
    });
    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assignments', error: err.message });
  }
};
