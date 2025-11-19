// utils/refreshDocTypeAssignments.js
const User = require ('../models/user');
const DocTypeAssignment = require ('../models/DocTypeAssignment');
const DocModelAssignment = require ('../models/document');
const { docTypeAssignments } = require ('../Config/docTypeAssignments');
const { syncDocAssignments } = require('./syncAssignments');

exports.refreshDocTypeAssignments = async () => {
  const allAdmins = await User.find({ role: 'admin' });
  const results = [];

  for (const [docType, adminEmails] of Object.entries(docTypeAssignments)) {
    const matchedAdmins = allAdmins.filter((a) =>
      adminEmails.includes(a.email)
    );
    // const assignedIds = matchedAdmins.map((a) => a._id);

    const updated = await DocTypeAssignment.findOneAndUpdate(
      { docType },
      { assignedAdmins: matchedAdmins },
    //   { assignedAdmins: assignedIds },
      { upsert: true, new: true }
    );

    results.push({
      docType,
      assignedAdmins: matchedAdmins.map(({ _id, email, name, phone, adminLevel }) => ({
        _id,
        email,
        name,
        phone,
        adminLevel
      })),
      // assignedAdmins: (({ _id, email, name, phone, adminLevel }) => ({ _id, email, name, phone, adminLevel }))(matchedAdmins),
      // assignedAdmins: matchedAdmins.map((a) => {a.name,a.email,a.phone,a.adminLevel}),
    });
  }

  return results;
};


// ✅ Update docType assignments
exports.updateDocTypeAssignment = async (req, res) => {
  try {
    // const { docType, assignedAdmins } = req.body;
  const assignments = await DocTypeAssignment.find();
  for (const a of assignments) {
    await syncDocAssignments(a.docType);
  }
    // const updated = await DocTypeAssignment.findOneAndUpdate(
    //   { docType },
    //   { assignedAdmins },
    //   { new: true, upsert: true }
    // );

    // // 🔄 Immediately sync related documents
    // await syncDocAssignments(docType);

    res.json({
      message: 'DocType assignment updated & all documents synced successfully.',
      updated,
    });
  } catch (error) {
    console.error('Error updating docType assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

