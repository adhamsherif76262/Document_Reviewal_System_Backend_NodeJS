// models/document.js
const mongoose = require('mongoose');
const nanoid = require('nanoid');
// import { nanoid } from 'nanoid'; // optional if you go with random IDs

const FieldSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'image', 'pdf'],
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  tab: {
    type: String, // ✅ this stores the tab name or stable key
    required: true,
  },
  review: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComment: String,
  }
  
}, { _id: false } // ✅ Prevents generating _id for each field
);

const documentSchema = new mongoose.Schema({
  user: {
    type: Object, // Directly embed: { _id, name, email }
    required: true
  },

  docType: {
    type: String,
    enum: [
      'Domestic Organic Pesticide',
      'Imported Organic Pesticide',
      'Domestic Organic Nutrition',
      'Imported Organic Nutrition',
      'Organic Farm',
      'Exporters Organic Production',
      'Importers Organic Production',
      'Warehouse',
      'Factory Or Production Unit',
      'Conformity Office Or Entity',
      'Consultancy Firms Or Scientific Offices',
      'Organic Feed Logo',
      'Under_Development_1',
      'Under_Development_2',
      'Under_Development_3',
    ], // adjust as needed
    required: true
  },

  state: {
    type: String,
    enum: ['Domestic', 'Imported' ,'General'],
    default: 'General',
    required: true
  },

  docNumber: {
    type: String,
    unique: true,
    default: () => `DOC-${nanoid(8)}`, // or use incremental method if preferred
  },

  fields: {
    type: Map,
    of: FieldSchema,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'partiallyApproved', 'approved', 'rejected'],
    default: 'pending'
  },

  submittedAt: {
    type: Date,
    default: Date.now
  },

  lastReviewedAt: {
    type: Date
  },
    // 🧭 Custody management
    custody: {
      currentHolder: {
        type: Object,
        ref: 'User',
      },
      previousHolders: [
        {
          type: Object,
          ref: 'User',
        },
      ],
    },

    // 🧩 Delegated admins (for multi-review process)
    assignedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // 🕓 Optional audit trail for review & transfers
    activityLog: [
      {
        action: String, // 'submitted', 'assigned', 'reviewed', 'returned'
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
},
{
  timestamps: true, // Adds createdAt and updatedAt fields
}
);
module.exports = mongoose.model('Document', documentSchema);

// const documentSchema = new mongoose.Schema(
//   {
//     user: {
//       // type: mongoose.Schema.Types.ObjectId,
//       // ref: 'User', // Reference to the User model
//       type : Object,
//       required: true,
//     },
//     fileUrl: {
//       type: String,
//       required: true,
//     },
//     fileName: {
//       type: String,
//       required: true,
//     },
//     title: {
//       type: String,
//       required: [true, 'Document title is required'],
//     },
//     description: {
//       type: String,
//     },
//     category: {
//       type: String,
//     },
//     status: {
//       type: String,
//       enum: ['pending', 'approved', 'rejected'],
//       default: 'pending',
//     },
//     adminComment: {
//       type: String,
//     },
//   },
//   {
//     timestamps: true, // Adds createdAt and updatedAt fields
//   }
// );