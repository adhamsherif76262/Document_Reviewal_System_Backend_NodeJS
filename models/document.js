// models/document.js
const mongoose = require('mongoose');
// const {nanoid} = require('nanoid');
// import { nanoid } from 'nanoid'; // optional if you go with random IDs
const { customAlphabet } = require('nanoid');

// Define the alphabet to include only digits (0-9)
const nanoid = customAlphabet('0123456789', 8);

// // Generate an 8-digit random number
// const randomNumber = nanoid();

// console.log(randomNumber);

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
      adminComment: { type: String, default: '' },
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
    index: true, // index to speed up searches
    default: () => `${nanoid()}`, // or use incremental method if preferred
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
  certificate: {
      images: [String], // array of URLs (Cloudinary/Supabase)
      uploadedBy: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        name: String,
        email: String,
        role: String, // e.g. "admin"
        adminLevel: String, // e.g. "regular" or "super"
        phone: String,
      },
      uploadedAt: Date,
    
      approvedBy: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        name: String,
        email: String,
        role: String, // always "admin"
        adminLevel: String, // always "super"
        phone: String,
      },
      approvedAt: Date,
      rejectedBy: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        name: String,
        email: String,
        role: String, // always "admin"
        adminLevel: String, // always "super"
        phone: String,
      },
      rejectedAt: Date,
    
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      comment: String, // optional comment if rejected
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
        type: Object,
      },
    ],

    // 🕓 Optional audit trail for review & transfers
    // activityLog: use denormalized 'by' snapshot for immutability
    activityLog: [
      {
        _id: false, // Prevent Mongoose from adding an ObjectId
        action: { type: String, required: true }, // e.g. "submitted", "approved"
        by: { type: String, required: true },     // e.g. "Adham Sherif"
        role: { type: String, required: true },   // "user" or "admin"
        timestamp: { type: Date, default: Date.now }
      },
    ],
    hasPendingResubmission: { type: Boolean, default: false },
    adminComment: { type: String, default: '' },
},
{
  timestamps: true, // Adds createdAt and updatedAt fields
}
);

documentSchema.pre('save', function (next) {
  const fields = this.fields || {};
  const hasPending = Array.from(fields.values()).some(
    (f) => f.review.status !== 'approved'
  );
  this.hasPendingResubmission = hasPending;
  next();
});


// Useful indexes
documentSchema.index({ 'user._id': 1 }); // get all docs for a user fast
documentSchema.index({ 'custody.currentHolder._id': 1 }); // find docs currently held by admin
documentSchema.index({ docNumber: 1 }, { unique: true }); // ensure uniqueness (redeclared for emphasis)

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