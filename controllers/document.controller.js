// controllers/document.controller.js

const Document = require('../models/document');
const DocTypeAssignment  = require('../models/DocTypeAssignment');
const Review = require('../models/review');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const fs = require('fs'); // Optional for debugging
const Log = require('../models/log'); // make sure this is at the top
const logger = require('../utils/logger');
const { Resend } = require('resend');

const generateSubmissionPDFBuffer = require('../utils/pdfTemplates/submission');
const generatereSubmissionPDFBuffer = require('../utils/pdfTemplates/resubmission');
const generaterereviewPDFBuffer = require('../utils/pdfTemplates/review');
// const uploadFile  = require('../utils/fileUpload.js');

const submissionEmailTemplate = require('../utils/emailTemplates/submission');
const resubmissionEmailTemplate = require('../utils/emailTemplates/resubmission');
const reviewsubmissionEmailTemplate = require('../utils/emailTemplates/review');
const finalcertificatereviewsubmissionEmailTemplate = require('../utils/emailTemplates/certificateReview');
// const templates = require('../templates'); // directory containing docType/state definitions


// @route   POST /api/documents/upload
// @desc    Upload a document with metadata
// @access  Private (Authenticated users only)
const { uploadToCloudinary , deleteCloudinaryFolder } = require('../utils/cloudinary');
const { uploadToSupabase , deleteSupabaseFolder } = require('../utils/supabase');
// import { loadTemplate } from '../utils/loadTemplate.js';
const {loadTemplate} = require ('../utils/loadTemplate');
const { rollbackUploads } = require('../utils/rollbackUploads');

    const Brevo = require("@getbrevo/brevo");

// exports.createDocument = async (req, res) => {
//   try {
//     if (req.user.role !== 'user') {
//       return res.status(403).json({ message: 'Only Users Can Submit Documents' });
//     }
//     // if (req.user.expiryStatus !== 'active') {
//     //   return res.status(403).json({ message: 'Only Active Users can Submit Documents , Please Activate Your Account Before Attempting To Submit A Document' });
//     // }
//     console.log('🧾 req.body received:', req.body);
//     console.log('🗂 req.files received:', req.files?.map(f => f.fieldname));

//     const { docType, state } = req.body;
//     const parsedTexts = {};
//     const parsedFiles = {};

//     const template = loadTemplate(docType);

//     if (!template[state]) {
//       return res.status(400).json({ error: `State '${state}' not defined in template.` });
//     }

//         const stateTemplate = template[state];
//     const allowedFields = new Map(); // name → { type, required, tab }

//     // 🔍 Collect all valid fields from the JSON template
//     for (const [tabName, fields] of Object.entries(stateTemplate.tabs)) {
//       for (const f of fields) {
//         allowedFields.set(f.name, {
//           type: f.type,
//           required: f.required || false,
//           tab: tabName,
//         });
//       }
//     }

//         // 🧠 Auto-fetch assigned admins for this docType
//     // const assignment = await DocTypeAssignment.findOne({ docType });
//     // const assignedTo = assignment ? assignment.assignedAdmins : [];

//     // 🧱 Parse text fields
//     if (req.body.text && typeof req.body.text === 'object') {
//       for (const [key, value] of Object.entries(req.body.text)) {
//         parsedTexts[key] = { type: 'text', value, tab: 'General_Info' };
//       }
//     } else {
//       for (const [key, value] of Object.entries(req.body)) {
//         const match = key.match(/^text\[(.+)\]$/);
//         if (match) {
//           parsedTexts[match[1]] = { type: 'text', value, tab: 'General_Info' };
//         }
//       }
//     }

//         const assignment = await DocTypeAssignment.findOne({ docType });
//     const assignedAdmins = assignment
//       ? assignment.assignedAdmins
//       : [];
//       const Prev_Holders = []
//       const userData = {
//         _id: req.user._id,
//         name: req.user.name,
//         email: req.user.email,
//         role: req.user.role,
//         phone: req.user.phone,
//       };
//       Prev_Holders.push(userData)

//         // 🧱 STEP 1 — Create a shell document (to generate docNumber)
//     const shellDoc = await Document.create({
//       user: req.user,
//       docType,
//       state,
//       assignedAdmins:assignedAdmins,
//       // assignedAdmins:assignedTo,
//       fields: {}, // empty initially
//       status: 'pending',
//       submittedAt: new Date(),
//       custody: {
//         currentHolder: (({ _id, email, name, role, phone, adminLevel }) => ({ _id, email, name, role, phone, adminLevel }))(req.user),
//         previousHolders: Prev_Holders,
//       },
//     });

//     const { docNumber } = shellDoc; // ✅ now available
//     const userName = req.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
//     const baseFolder_Cloudinary = `CLOA_Document_Reviewal_System/${docType}_${docNumber}_${userName}`;
//     const baseFolder_Superbase = `${docType}_${docNumber}_${userName}`;

//     // 🧩 STEP 2 — Handle file uploads
//     if (req.files && Array.isArray(req.files)) {
//       for (const file of req.files) {
//         const match = file.fieldname.match(/^files\[(.+)\]$/);
//         if (!match) continue;

//         const fieldKey = match[1];

//          const def = allowedFields.get(fieldKey);

//         if (!def) {
//           throw new Error(`Field '${fieldKey}' is not defined for ${docType} with state (${state}).`);
//         }

//         // check file type consistency
//         const isImage = file.mimetype.startsWith('image/');
//         const isPDF = file.mimetype === 'application/pdf';

//         if (def.type === 'image' && !isImage) {
//           throw new Error(`Field '${fieldKey}' expects image files only.`);
//         }
//         if (def.type === 'pdf' && !isPDF) {
//           throw new Error(`Field '${fieldKey}' expects a PDF file.`);
//         }
//         if (def.type === 'images' && !isImage) {
//           throw new Error(`Field '${fieldKey}' expects multiple images only.`);
//         }


//         // Initialize if not exists
//         if (!parsedFiles[fieldKey]) {
//           parsedFiles[fieldKey] = {
//             type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
//             value: [],
//             tab: file.mimetype.startsWith('image/') ? 'Images' : 'Pdfs',
//           };
//         }

//         const fieldFolder_Cloudinary = `${baseFolder_Cloudinary}/${fieldKey}`;
//         const fieldFolder_Superbase = `${baseFolder_Superbase}/${fieldKey}`;
//         const index = parsedFiles[fieldKey].value.length + 1;
//         const ext = file.originalname.split('.').pop();
//         const readableName = `${fieldKey}_${index}.${ext}`;

//         // Upload based on type
//         let url;
//         if (file.mimetype.startsWith('image/')) {
//           url = await uploadToCloudinary(file, fieldFolder_Cloudinary, `${fieldKey}_${index}`);
//         } else if (file.mimetype === 'application/pdf') {
//           url = await uploadToSupabase(file, fieldFolder_Superbase, readableName);
//         }

//         parsedFiles[fieldKey].value.push(url);
//       }
//     }

//               // 🧩 STEP 5 — Ensure all required fields exist
//     for (const [fieldKey, def] of allowedFields.entries()) {
//       const exists =
//         parsedTexts[fieldKey] ||
//         (parsedFiles[fieldKey] && parsedFiles[fieldKey].value.length > 0);
//       if (def.required && !exists) {
//         throw new Error(`Missing required field: '${fieldKey}'`);
//       }
//     }


//     // 🧩 STEP 3 — Merge fields and update the shell doc
//     const finalFields = { ...parsedTexts, ...parsedFiles };

//     shellDoc.fields = finalFields;
//     shellDoc.activityLog.push({
//       action: 'Submission',
//       // action: document.status,
//       by: req.user.name,
//       role: req.user.role,
//       timestamp: new Date(),
//     });

//     await shellDoc.save();

//     console.log('✅ Final parsedTexts:', parsedTexts);
//     console.log('✅ Final parsedFiles:', parsedFiles);
//     console.log('✅ Combined fields:', finalFields);

//     // 📨 Log + Email
//     await Log.create({
//       action: 'fileSubmission',
//       user: req.user,
//       document: shellDoc,
//       message: `User ${req.user.name} with email ${req.user.email} submitted a document.`,
//     });

//     const pdfBuffer = await generateSubmissionPDFBuffer(req.user, shellDoc);
//     const { subject, htmlBody } = submissionEmailTemplate(req.user, shellDoc);

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: req.user.email,
//       subject,
//       html: htmlBody,
//       attachments: [{ filename: 'submission-summary.pdf', content: pdfBuffer }],
//     });

//     res.json({ message: 'Document created successfully', fields: finalFields });
//   } catch (err) {
//     console.error('❌ Error:', err);
//     res.status(500).json({ message: err.message });
//   }
// };


// @route   POST /api/documents/:id/review
// @desc    Admin reviews a document (field-level)


exports.createDocument = async (req, res) => {
  const theUploadedFiles = []; // ✅ use this for rollback tracking
  let shellDoc;
  // global.__uploadCounter = 0;

  try {

    if (req.user.role !== 'user')
      return res.status(403).json({ message: 'Only Users Can Submit Documents' });

    if (req.user.expiryStatus === 'expired')
      return res.status(403).json({ message: "Your Account Has Expired, Please Contact The System Admins To Extend Your Account's Expiry Date. (Only Users With Active Accounts Can Submit Documents)" });

    const { docType, state } = req.body;
    const template = loadTemplate(docType);

    if (!template[state])
      return res.status(400).json({ error: `State '${state}' not defined in template.` });

    const stateTemplate = template[state];
    const allowedFields = new Map();

    // Build allowedFields
    for (const [tabName, fields] of Object.entries(stateTemplate.tabs)) {
      for (const f of fields) {
        allowedFields.set(f.name, { type: f.type, required: f.required || false, tab: tabName });
      }
    }

    const parsedTexts = {};
    const parsedFiles = {};

    // 🧱 Step 1: Validate all fields before creating the doc
    if (req.body.text && typeof req.body.text === 'object') {
      for (const [key, value] of Object.entries(req.body.text)) {
        if (!allowedFields.has(key)) {
          throw new Error(`Unexpected text field '${key}' for ${docType} (${state}).`);
        }
        parsedTexts[key] = { type: 'text', value, tab: allowedFields.get(key).tab };
      }
    }

    // Validate files exist and are correct type
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const match = file.fieldname.match(/^files\[(.+)\]$/);
        if (!match) continue;
        const fieldKey = match[1];
        const def = allowedFields.get(fieldKey);

        if (!def)
          throw new Error(`Field '${fieldKey}' is not defined for ${docType} (${state}).`);

        const isImage = file.mimetype.startsWith('image/');
        const isPDF = file.mimetype === 'application/pdf';

        if (def.type === 'image' && !isImage)
          throw new Error(`Field '${fieldKey}' expects image files only.`);
        if (def.type === 'pdf' && !isPDF)
          throw new Error(`Field '${fieldKey}' expects a PDF file.`);
        if (def.type === 'images' && !isImage)
          throw new Error(`Field '${fieldKey}' expects multiple images only.`);

        // Temporarily store the file object; don’t upload yet
        if (!parsedFiles[fieldKey]) {
          parsedFiles[fieldKey] = { files: [], def };
        }
        parsedFiles[fieldKey].files.push(file);
      }
    }

    // 🧱 Step 2: Ensure required fields exist before DB insertion
    for (const [fieldKey, def] of allowedFields.entries()) {
      const exists =
        parsedTexts[fieldKey] ||
        (parsedFiles[fieldKey] && parsedFiles[fieldKey].files.length > 0);
      if (def.required && !exists) {
        throw new Error(`Missing required field: '${fieldKey}'`);
      }
    }

    // ✅ If we reach here, all validation has passed — create the doc
    const assignment = await DocTypeAssignment.findOne({ docType });
    const assignedAdmins = assignment ? assignment.assignedAdmins : [];

    const Prev_Holders = [{
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
    }];

    shellDoc = await Document.create({
      user: req.user,
      docType,
      state,
      assignedAdmins,
      fields: {},
      status: 'pending',
      submittedAt: new Date(),
      custody: {
        currentHolder: (({ _id, email, name, role, phone, adminLevel }) =>
          ({ _id, email, name, role, phone, adminLevel }))(req.user),
        previousHolders: Prev_Holders,
      },
    });

    // 🧱 Step 3: Upload files only now
    const { docNumber } = shellDoc;
    const userName = req.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
    const baseFolder_Cloudinary = `CLOA_Document_Reviewal_System/${docType}_${docNumber}_${userName}`;
    const baseFolder_Supabase = `${docType}_${docNumber}_${userName}`;

    const uploadedFiles = {};

    for (const [fieldKey, { files }] of Object.entries(parsedFiles)) {
      uploadedFiles[fieldKey] = {
        type: allowedFields.get(fieldKey).type,
        value: [],
        tab: allowedFields.get(fieldKey).tab,
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const index = i + 1;
        const ext = file.originalname.split('.').pop();
        const readableName = `${fieldKey}_${index}.${ext}`;
        let url;

        if (file.mimetype.startsWith('image/')) {
          url = await uploadToCloudinary(file, `${baseFolder_Cloudinary}/${fieldKey}`, readableName);
       // ✅ track uploaded Cloudinary folder for rollback
          theUploadedFiles.push({
            provider: 'cloudinary',
            folderPath: `${baseFolder_Cloudinary}`,
          });
        } else {
          url = await uploadToSupabase(file, `${baseFolder_Supabase}/${fieldKey}`, readableName);
       // ✅ track uploaded Supabase folder for rollback
          theUploadedFiles.push({
            provider: 'supabase',
            folderPath: `${baseFolder_Supabase}`,
          });
        }
      // 🔥 TEMP: simulate a random failure after first few uploads
        // if (Math.random() < 0.5) throw new Error('Simulated failure for rollback test');
        // 🔥 TEMP: simulate a failure only after 25 successful uploads
// if (!global.__uploadCounter) global.__uploadCounter = 0;
// global.__uploadCounter++;

// if (global.__uploadCounter === 26) {
//   throw new Error('Simulated failure for rollback test after 25 uploads');
// }

        uploadedFiles[fieldKey].value.push(url);
      }
    }

    // 🧩 Step 4: Merge and save
    const finalFields = { ...parsedTexts, ...uploadedFiles };
    shellDoc.fields = finalFields;
    shellDoc.activityLog.push({
      action: 'Submission',
      by: req.user.name,
      role: req.user.role,
      timestamp: new Date(),
    });

    await shellDoc.save();


    const pdfBuffer = await generateSubmissionPDFBuffer(req.user, shellDoc);
    const { subject, htmlBody } = submissionEmailTemplate(req.user, shellDoc);



const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Sends an email using Brevo with optional PDF attachment
 */

  const emailData = {
    sender: {
      name: "CLOA Document Review System",
      email: process.env.EMAIL_USER
    },
    to: [{ email: req.user.email }],
    subject,
    htmlContent: htmlBody,
        attachment: [{name: "Submission-Summary.pdf", content: pdfBuffer.toString("base64")}]
    // attachments: [{ filename: 'submission-summary.pdf', content: pdfBuffer }],
  };

  try {
    await brevoClient.sendTransacEmail(emailData);
    console.log(`📧 Email sent to ${req.user.email}`);
  } catch (err) {
    console.error("📧 Brevo email failed:", err.response?.body || err.message);
  }
        // 📨 Log + Email
    await Log.create({
      action: 'fileSubmission',
      user: {_id : req.user._id, name : req.user.name, email: req.user.email},
      document: shellDoc,
      message: `User ${req.user.name} with email ${req.user.email} submitted a document.`,
    });

    res.json({ message: 'Document created successfully', fields: finalFields });

  } catch (err) {
      console.error('Upload failed:', err.message);
      if (theUploadedFiles.length > 0) {
        await rollbackUploads(theUploadedFiles);
          // await rollbackUploads(uploadedFilesMeta);
      }
    // 🧹 2️⃣ Delete shellDoc if it was created
      if (typeof shellDoc !== 'undefined' && shellDoc?._id) {
        await Document.findByIdAndDelete(shellDoc._id);
        console.log(`🗑️ Deleted incomplete document ${shellDoc._id} due to failure`);
      }
      return res.status(400).json({ error: 'Upload failed and rolled back' });
    // console.error('❌ Error:', err);
    // res.status(500).json({ message: err.message });
  }
};


// @access  Private (Admins only)
exports.reviewDocument = async (req, res) => {
  let originalFieldStates = null; // 🟣 to store for rollback
  let document = null;
  try {
    const { status, comment, fieldsReview } = req.body;

    if (!['approved', 'rejected', 'partiallyApproved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can review documents' });
    }

    // 1️⃣ Load document
    document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // 2️⃣ Restrict regular admins to assigned docs only
    if (req.user.adminLevel === "regular") {
      const isAssigned = document.assignedAdmins.some(
        (a) => a._id.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied. Not assigned to this document.' });
      }
    }

    // 3️⃣ Retrieve template fields for validation
const fullTemplate = loadTemplate(document.docType); // maybe returns both Domestic & Imported

// Pick the right state:
const template = fullTemplate[document.state]; // e.g., fullTemplate["Imported"]
    function getTemplateFieldNames(template) {
  const fieldNames = [];
  if (!template || !template.tabs) return fieldNames;
    
  for (const tabFields of Object.values(template.tabs)) {
    for (const field of tabFields) {
      if (field.name) fieldNames.push(field.name);
    }
  }

  return fieldNames;
}

    const templateFieldNames = getTemplateFieldNames(template);

    // 4️⃣ Validate fieldsReview keys
    if (fieldsReview) {
      for (const key of Object.keys(fieldsReview)) {
        if (!templateFieldNames.includes(key)) {
          return res.status(400).json({
            message: `Invalid field '${key}' — not defined in template for ${document.docType} (${document.state}).`
          });
        }
      }
    }

    // 5️⃣ Save original states for rollback (MODE A)
    originalFieldStates = {};
    for (const [key, field] of document.fields.entries()) {
      originalFieldStates[key] = {
        status: field.review.status,
        adminComment: field.review.adminComment
      };
    }

    // 6️⃣ Apply field-level reviews
    if (fieldsReview && typeof fieldsReview === "object") {
      for (const [fieldName, fieldData] of Object.entries(fieldsReview)) {
        const field = document.fields.get(fieldName);
        if (field) {
          field.review.status = fieldData.status || 'pending';
          field.review.adminComment = fieldData.adminComment || '';
        }
      }
    }

    // 7️⃣ Determine doc-level status
    const allStatuses = Array.from(document.fields.values()).map(f => f.review.status);

    if (allStatuses.every(s => s === "approved")) {
      document.status = "approved";
    } else if (allStatuses.every(s => s === "rejected")) {
      document.status = "rejected";
    } else {
      document.status = "partiallyApproved";
    }

    // 8️⃣ Apply top-level comment & metadata
    if (comment) document.adminComment = comment;
    document.lastReviewedAt = new Date();

    // 9️⃣ Update custody tracking
    const adminData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      adminLevel: req.user.adminLevel || "N/A"
    };

    if (!document.custody.previousHolders.some(a => a.email === req.user.email)) {
      document.custody.previousHolders.push(adminData);
    }

    document.custody.currentHolder = adminData;
    document.hasPendingResubmission = document.status !== "approved";

    // 🔟 Create lifecycle log entry
    document.activityLog.push({
      action: document.status,
      by: req.user.name,
      role: req.user.role,
      timestamp: new Date()
    });

    await document.save(); // 💾 Save doc before generating PDF

// 1️⃣1️⃣ Prepare fieldsReviewed for Review record
const fieldsObj = 
  document.fields instanceof Map
    ? Object.fromEntries(document.fields)
    : (document.fields && typeof document.fields === "object")
      ? document.fields
      : {};

const fieldsReviewed = Object.entries(fieldsObj)
  .filter(([_, f]) => f && f.review && ["approved", "rejected"].includes(f.review.status))
  .map(([key, f]) => ({
    fieldKey: key,
    status: f.review.status,
    adminComment: f.review.adminComment || null
  }));


    const review = await Review.create({
      document: document,
      // reviewedBy: req.user.name,
      reviewedBy: (({ _id, email, name, phone, adminLevel }) => ({ _id, email, name, phone, adminLevel }))(req.user),
      status: document.status,
      comment,
      docNumber: document.docNumber,
      docType: document.docType,
      state: document.state,
      fieldsReviewed
    });

    // 1️⃣2️⃣ Send email
    const admin = await User.findById(req.user._id);
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS
    //   }
    // });

    const pdfBuffer = await generaterereviewPDFBuffer(document, document.status, admin, comment);
    const { subjectPrefix, htmlBody } = reviewsubmissionEmailTemplate(req.user, document, document.status, admin, comment);

      
const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Sends an email using Brevo with optional PDF attachment
 */

  const emailData = {
    sender: {
      name: "CLOA Document Review System",
      email: process.env.EMAIL_USER
    },
    to: [{ email: document.user.email }],
    subject:subjectPrefix,
    htmlContent: htmlBody,
      attachment: [{name: "Review-Summary.pdf", content: pdfBuffer.toString("base64")}]
    };

  try {
    await brevoClient.sendTransacEmail(emailData);
    console.log(`📧 Email sent to ${document.user.email}`);
  } catch (err) {
    console.error("📧 Brevo email failed:", err.response?.body || err.message);
  }
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: document.user.email,
    //   subject: subjectPrefix,
    //   html: htmlBody,
    //   attachments: [{ filename: "review-summary.pdf", content: pdfBuffer }]
    // });

    // 1️⃣3️⃣ Optional audit log
    await Log.create({
      action: document.status,
      user: {_id : document.user._id, name : document.user.name, email: document.user.email},
      admin: {_id : req.user._id, name : req.user.name, email: req.user.email},
      document: document,
      message: `Document ${document.docType} was ${document.status} by ${req.user.name} with email ${req.user.email}.`
    });

    return res.status(200).json({
      message: `Document ${document.status} successfully and user notified`,
      review,
      document
    });

  } catch (error) {
    logger.error("Review Error:", error.message);

    // 🔥 MODE A ROLLBACK → RESET FIELDS TO ORIGINAL STATE
    if (originalFieldStates && document) {
  try {
    console.log("🔄 Rolling back field review changes…");

    for (const [key, state] of Object.entries(originalFieldStates)) {
      const field = document.fields.get(key);

      if (!field || !field.review) {
        console.warn(`⚠️ Skipped rollback for '${key}' – field missing`);
        continue;
      }

      field.review.status = state.status ?? "pending";
      field.review.adminComment = state.adminComment ?? "";
    }

    await document.save();
    console.log("✅ Rollback completed — original field states restored.");
  } catch (rollbackErr) {
    console.error("❌ Rollback failed:", rollbackErr);
  }
    }

    return res.status(500).json({
      message: "Review Error — all changes rolled back",
      error: error.message
    });
  }
};

// @access  Private (Admins only)
// exports.reviewDocument = async (req, res) => {
//   try {
//     const { status, comment, fieldsReview } = req.body;

//     if (!['approved', 'rejected', 'partiallyApproved'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status' });
//     }

//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Only admins can review documents' });
//     }

//         const document = await Document.findById(req.params.id);
//     if (!document) return res.status(404).json({ message: 'Document not found' });

//          // 🟣 Restrict admin access if not assigned
//     if (req.user.role === 'admin' && req.user.adminLevel === "regular") {
//       const isAssigned = document.assignedAdmins.some(
//         admin => admin._id.toString() === req.user._id.toString()
//       );
//       if (!isAssigned) {
//         console.log(isAssigned)
//         return res.status(403).json({ message: 'Access denied. You are not assigned to this document.' });
//       }
//     }
    


//     // ✅ 1. Update field-level reviews
//     if (fieldsReview && typeof fieldsReview === 'object') {
//       for (const [fieldName, fieldData] of Object.entries(fieldsReview)) {
//         if (document.fields.has(fieldName)) {
//           document.fields.get(fieldName).review.status = fieldData.status || 'pending';
//           document.fields.get(fieldName).review.adminComment = fieldData.adminComment || '';
//         }
//       }
//     }

//     // ✅ 2. Determine overall doc status automatically
//     const fieldStatuses = Array.from(document.fields.values()).map(f => f.review.status);
//     if (fieldStatuses.every(s => s === 'approved')) {
//       document.status = 'approved';
//     } else if (fieldStatuses.every(s => s === 'rejected')) {
//       document.status = 'rejected';
//     } else {
//       document.status = 'partiallyApproved';
//     }

//     // ✅ 3. Update top-level admin comment
//     if (comment) document.adminComment = comment;
//     document.lastReviewedAt = new Date();

//     // ✅ 4. Update custody
//     const adminData = {
//       _id: req.user._id,
//       name: req.user.name,
//       email: req.user.email,
//       phone: req.user.phone,
//       adminLevel: req.user.adminLevel || 'N/A',
//     };

//     if (!document.custody.previousHolders.some(a => a.email === req.user.email)) {
//       document.custody.previousHolders.push(adminData);
//     }

//     document.custody.currentHolder = adminData;

//     // ✅ 5. Update hasPendingResubmission flag
//     document.hasPendingResubmission = document.status !== 'approved';

//     // ✅ 6. Log lifecycle activity

//     document.activityLog.push({
//       action: document.status,
//       by: req.user.name,
//       role: req.user.role,
//       timestamp: new Date(),
//     });


//     await document.save();

// let fieldsObj;

// // ✅ Convert Mongoose Map to plain object properly
// if (document.fields instanceof Map) {
//   fieldsObj = Object.fromEntries(document.fields);
//   console.log("✅ Converted from Map to Object:", fieldsObj);
// } else {
//   fieldsObj = document.fields || {};
//   console.log("✅ Already plain object:", fieldsObj);
// }

// const fieldsReviewed = Object.entries(fieldsObj)
//   .filter(([_, field]) => ['approved', 'rejected'].includes(field?.review?.status))
//   .map(([key, field]) => ({
//     fieldKey: key,
//     status: field.review.status,
//     adminComment: field.review.adminComment || null,
//   }));

// console.log("✅ FINAL fieldsReviewed =", fieldsReviewed);

//     // ✅ 7. Create review record
//     const review = await Review.create({
//       document: document,
//       reviewedBy: req.user.name,
//       status: document.status,
//       comment,
//       docNumber: document.docNumber,
//       docType: document.docType,
//       state: document.state,
//       fieldsReviewed,
//     });

//     // ✅ 8. Send notification email
//     const admin = await User.findById(req.user._id);
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const pdfBuffer = await generaterereviewPDFBuffer(document, document.status, admin, comment);
//     const { subjectPrefix, htmlBody } = reviewsubmissionEmailTemplate(req.user, document, document.status, admin, comment);

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: document.user.email,
//       subject: subjectPrefix,
//       html: htmlBody,
//       attachments: [{ filename: 'review-summary.pdf', content: pdfBuffer }],
//     });

//     // ✅ 9. Audit log (optional)
//     await Log.create({
//       action: document.status,
//       user : document.user.name,
//       admin: req.user.name,
//       document: document,
//       message: `Document ${document.docType} was ${document.status} by ${req.user.name} with email ${req.user.email}`,
//     });

//     res.status(200).json({
//       message: `Document ${document.status} successfully and user notified`,
//       review,
//       document,
//     });

//   } catch (error) {
//     logger.error('Review Error:', error.message);
//     res.status(500).json({ message: 'Review Error', error: error.message });
//   }
// };


// @route   PATCH /api/documents/:id/resubmit
// @desc    User re-submits a rejected or pending document
// @access  Private (Authenticated users only)
exports.resubmitDocument = async (req, res) => {
  const theUploadedFiles = []; // ✅ track uploads for rollback
  let document;

  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can resubmit documents' });
    }

    if (req.user.expiryStatus === 'expired')
    return res.status(403).json({ message: "Your Account Has Expired, Please Contact The System Admins To Extend Your Account's Expiry Date. (Only Users With Active Accounts Can Re-Submit Documents)" });

    document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only resubmit your own documents' });
    }

    if (document.status !== 'rejected' && document.status !== 'partiallyApproved') {
      // return res.status(400).json({ message: 'Only Rejected documents can be resubmitted' });
      return res.status(400).json({ message: 'Only Rejected or Partially Approved documents can be resubmitted' });
    }

    const { docType, state } = document;
    const template = loadTemplate(docType);
    if (!template[state]) return res.status(400).json({ error: `State '${state}' not defined in template.` });
    const stateTemplate = template[state];

    // Build allowedFields map
    const allowedFields = new Map();
    for (const [tabName, fields] of Object.entries(stateTemplate.tabs)) {
      for (const f of fields) {
        allowedFields.set(f.name, { type: f.type, required: f.required || false, tab: tabName });
      }
    }

    const parsedTexts = {};
    const parsedFiles = {};

    // 🔹 Parse text fields (only rejected ones)
    if (req.body.text && typeof req.body.text === 'object') {
      for (const [key, value] of Object.entries(req.body.text)) {
        const existing = document.fields.get(key);
        if (!existing || existing.review?.status === 'rejected') {
          if (!allowedFields.has(key)) {
            throw new Error(`Unexpected text field '${key}' for ${docType} (${state}).`);
          }
          parsedTexts[key] = {
            type: 'text',
            value,
            tab: allowedFields.get(key).tab,
            review: { status: 'pending', adminComment: '' },
          };
        }
      }
    }

    // 🔹 Parse uploaded files (only rejected fields)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const match = file.fieldname.match(/^files\[(.+)\]$/);
        if (!match) continue;
        const fieldKey = match[1];

        const existing = document.fields.get(fieldKey);
        if (existing && existing.review?.status !== 'rejected') continue; // skip approved

        const def = allowedFields.get(fieldKey);
        if (!def) throw new Error(`Field '${fieldKey}' is not defined for ${docType} (${state}).`);

        const isImage = file.mimetype.startsWith('image/');
        const isPDF = file.mimetype === 'application/pdf';
        if (def.type === 'image' && !isImage) throw new Error(`Field '${fieldKey}' expects image files only.`);
        if (def.type === 'pdf' && !isPDF) throw new Error(`Field '${fieldKey}' expects a PDF file.`);

        if (!parsedFiles[fieldKey]) {
          parsedFiles[fieldKey] = { type: def.type, value: [], tab: def.tab, review: { status: 'pending', adminComment: '' } };
        }

        const userName = req.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
        const baseFolder_Cloudinary = `CLOA_Document_Reviewal_System/${docType}_${document.docNumber}_${userName}`;
        const baseFolder_Supabase = `${docType}_${document.docNumber}_${userName}`;

        let url;
        const index = parsedFiles[fieldKey].value.length + 1;
        const ext = file.originalname.split('.').pop();
        const readableName = `${fieldKey}_${index}.${ext}`;

        if (isImage) {
          await deleteCloudinaryFolder(`${baseFolder_Cloudinary}/${fieldKey}`); // clear old
          url = await uploadToCloudinary(file, `${baseFolder_Cloudinary}/${fieldKey}`, readableName);
          theUploadedFiles.push({ provider: 'cloudinary', folderPath: `${baseFolder_Cloudinary}` });
        } else if (isPDF) {
          await deleteSupabaseFolder(`${baseFolder_Supabase}/${fieldKey}`); // clear old
          url = await uploadToSupabase(file, `${baseFolder_Supabase}/${fieldKey}`, readableName);
          theUploadedFiles.push({ provider: 'supabase', folderPath: `${baseFolder_Supabase}` });
        }

        parsedFiles[fieldKey].value.push(url);
      }
    }

    // 🔹 Ensure all required rejected fields are submitted
    for (const [key, def] of allowedFields.entries()) {
      const existing = document.fields.get(key);
      if (existing?.review?.status === 'rejected' && def.required) {
        const exists = parsedTexts[key] || parsedFiles[key]?.value?.length > 0;
        if (!exists) throw new Error(`Missing required rejected field: '${key}'`);
      }
    }

    // 🔹 Merge with existing fields
    const updatedFields = { ...Object.fromEntries(document.fields) };
    for (const [key, val] of Object.entries({ ...parsedTexts, ...parsedFiles })) {
      updatedFields[key] = val; // replace rejected field
    }

    document.fields = updatedFields;
    document.status = 'pending';
    document.lastReviewedAt = null;
    document.hasPendingResubmission = true;

    const userData = { _id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone };
    document.custody.currentHolder = userData;

    document.activityLog.push({ action: 'Re-Submission', by: req.user.name, role: req.user.role, timestamp: new Date() });

    await document.save();

    // 🔹 PDF/email
    const pdfBuffer = await generatereSubmissionPDFBuffer(req.user, document);
    const { subject, htmlBody } = resubmissionEmailTemplate(req.user, document);
    
const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Sends an email using Brevo with optional PDF attachment
 */

  const emailData = {
    sender: {
      name: "CLOA Document Review System",
      email: process.env.EMAIL_USER
    },
    to: [{ email: req.user.email }],
    subject,
    htmlContent: htmlBody,
        attachment: [{name: "Re-Submission-Summary.pdf", content: pdfBuffer.toString("base64")}]
    // attachments: [{ filename: 'submission-summary.pdf', content: pdfBuffer }],
  };

  try {
    await brevoClient.sendTransacEmail(emailData);
    console.log(`📧 Email sent to ${req.user.email}`);
  } catch (err) {
    console.error("📧 Brevo email failed:", err.response?.body || err.message);
  }
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    // });
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: req.user.email,
    //   subject,
    //   html: htmlBody,
    //   attachments: [{ filename: 'resubmission-summary.pdf', content: pdfBuffer }],
    // });
    // 🧾 Log action
    await Log.create({
      action: 'fileReSubmission',
      document,
      // user : document.user.name,
      user : {_id : req.user._id, name : req.user.name, email: req.user.email},
      message: `User ${req.user.name} with email ${req.user.email} resubmitted document #${document.docNumber}.`,
    });
    res.json({ message: 'Document resubmitted successfully — rejected fields pending review again', document });
  } catch (err) {
    console.error('Re-Submission failed:', err.message);

    // 🔄 Rollback uploaded files
    if (theUploadedFiles.length > 0) {
      await rollbackUploads(theUploadedFiles);
    }

    res.status(400).json({ error: 'Resubmission failed and rolled back', message: err.message });
  }
};


// @route   PATCH /api/documents/:id/resubmit
// @desc    User re-submits a rejected or pending document
// @access  Private (Authenticated users only)
// exports.resubmitDocument = async (req, res) => {
//   try {
    
//     if (req.user.role !== 'user') {
//       return res.status(403).json({ message: 'Only Users Can Re-Submit Documents' });
//     }
//     // if (req.user.expiryStatus !== 'active') {
//     //   return res.status(403).json({ message: 'Only Active Users can Re-Submit Documents , Please Activate Your Account Before Attempting To Re-Submit A Document' });
//     // }

//     console.log('♻️ Resubmission request received:');
//     console.log('🧾 req.body:', req.body);
//     console.log('🗂 req.files:', req.files?.map(f => f.fieldname));

//     const document = await Document.findById(req.params.id);
//     if (!document) return res.status(404).json({ message: 'Document not found' });

//     // 🧍 User authorization
//     if (document.user._id.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'You can only resubmit your own documents' });
//     }

//     // 🚫 Already approved? can't resubmit
//     if (document.status === 'approved') {
//       return res.status(400).json({ message: 'Approved documents cannot be resubmitted' });
//     }

//     const parsedTexts = {};
//     const parsedFiles = {};

//     // 🧩 Parse text fields (only for rejected ones)
//     if (req.body.text && typeof req.body.text === 'object') {
//   // JSON-based submission (e.g., from frontend app sending JSON)
//   for (const [key, value] of Object.entries(req.body.text)) {
//     const existingField = document.fields.get(key);
//     if (!existingField || existingField.review?.status === 'rejected') {
//       parsedTexts[key] = {
//         type: 'text',
//         value,
//         tab: existingField?.tab || 'General',
//         review: { status: 'pending', adminComment: '' },
//       };
//     }
//   }
//     } else {
//   // Form-data submission (like Postman or <form> upload)
//   for (const [key, value] of Object.entries(req.body)) {
//     const match = key.match(/^text\[(.+)\]$/);
//     if (match) {
//       const fieldKey = match[1];
//       const existingField = document.fields.get(fieldKey);
//       if (!existingField || existingField.review?.status === 'rejected') {
//         parsedTexts[fieldKey] = {
//           type: 'text',
//           value,
//           tab: existingField?.tab || 'General',
//           review: { status: 'pending', adminComment: '' },
//         };
//       }
//     }
//   }
//     }


//     // 🧱 Folder setup
//     const { docType, docNumber } = document;
//     const userName = req.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
//     const baseFolder_Cloudinary = `CLOA_Document_Reviewal_System/${docType}_${docNumber}_${userName}`;
//     const baseFolder_Superbase = `${docType}_${docNumber}_${userName}`;

//     // 🧩 Handle re-uploaded files (only for rejected fields)
//     if (req.files && Array.isArray(req.files)) {
//       for (const file of req.files) {
//         const match = file.fieldname.match(/^files\[(.+)\]$/);
//         if (!match) continue;
//         const fieldKey = match[1];

//         const existingField = document.fields.get(fieldKey);
//         if (existingField && existingField.review?.status !== 'rejected') {
//           console.log(`⛔ Skipping approved field: ${fieldKey}`);
//           continue; // skip approved fields
//         }
//         const fieldFolder_Cloudinary = `${baseFolder_Cloudinary}`;
//         const fieldFolder_Superbase = `${baseFolder_Superbase}`;
//         // const fieldFolder_Cloudinary = `${baseFolder_Cloudinary}/${fieldKey}`;
//         // const fieldFolder_Superbase = `${baseFolder_Superbase}/${fieldKey}`;
//         // ✅ Clean existing folder before new uploads
//         // const fieldFolder_Cloudinary = `${baseFolder_Cloudinary}/${fieldKey}`;
//         // const fieldFolder_Superbase = `${baseFolder_Superbase}/${fieldKey}`;

//         if (file.mimetype.startsWith('image/')) {
//           await deleteCloudinaryFolder(fieldFolder_Cloudinary);
//         } else if (file.mimetype === 'application/pdf') {
//           await deleteSupabaseFolder(fieldFolder_Superbase);
//         }

//         // initialize new field container
//         if (!parsedFiles[fieldKey]) {
//           parsedFiles[fieldKey] = {
//             type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
//             value: [],
//             tab: existingField?.tab || 'General',
//             review: { status: 'pending', adminComment: '' }, // ✅ reset review state
//           };
//         }

//         const index = parsedFiles[fieldKey].value.length + 1;
//         const ext = file.originalname.split('.').pop();
//         const readableName = `${fieldKey}_${index}.${ext}`;

//         let url;
//         if (file.mimetype.startsWith('image/')) {
//           url = await uploadToCloudinary(file, fieldFolder_Cloudinary, `${fieldKey}_${index}`);
//         } else if (file.mimetype === 'application/pdf') {
//           url = await uploadToSupabase(file, fieldFolder_Superbase, readableName);
//         }

//         parsedFiles[fieldKey].value.push(url);
//       }
//     }

//     // 🧩 Merge with existing fields — keep approved ones intact
//     const updatedFields = { ...Object.fromEntries(document.fields) };

//     // Merge resubmitted text and file fields
//     for (const [key, val] of Object.entries({ ...parsedTexts, ...parsedFiles })) {
//       updatedFields[key] = val; // replace old rejected field entirely
//     }

//     const userData = {
//       _id: req.user._id,
//       name: req.user.name,
//       email: req.user.email,
//       phone: req.user.phone,
//     };

//     document.fields = updatedFields;
//     document.status = 'pending';
//     document.custody.currentHolder = userData
//     document.lastReviewedAt = null;
//     await document.save();

//     console.log('✅ Resubmitted fields:', Object.keys(parsedTexts).concat(Object.keys(parsedFiles)));

//     document.activityLog.push({
//       action: 'Re-Submission',
//       by: req.user.name,
//       role: req.user.role,
//       timestamp: new Date(),
//     });
//     await document.save();

//     // 🧾 Log action
//     await Log.create({
//       action: 'fileReSubmission',
//       document,
//       user : document.user.name,
//       message: `User ${req.user.name} with email ${req.user.email} resubmitted document #${document.docNumber}.`,
//     });

//     // 📨 Email confirmation
//     const pdfBuffer = await generatereSubmissionPDFBuffer(req.user, document);
//     const { subject, htmlBody } = resubmissionEmailTemplate(req.user, document);

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: req.user.email,
//       subject,
//       html: htmlBody,
//       attachments: [
//         { filename: 'resubmission-summary.pdf', content: pdfBuffer },
//       ],
//     });

//     res.json({
//       message: 'Document resubmitted successfully — rejected fields are pending review again',
//       document,
//     });
//   }catch (error) {
//     logger.error('Re-Submission Error:', error.message);
//     res.status(500).json({ message: 'Re-Submission Error', error: error.message });
//   }
// };

// @route   GET /api/documents
// @desc    Admin view of all documents with filters, search & pagination
// @access  Private (Admins only)
exports.adminListDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all documents' });
    }

    const {
      docType,
      docNumber,
      currentHolderName,
      currentHolderEmail,
      state,
      hasPendingResubmission,
      status,
      certificateStatus,
      userName,
      userEmail,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // 🔍 1. Basic filters
    if (status) filter.status = status;
    if (docType) filter.docType = { $regex: docType, $options: 'i' };
    if (docNumber) filter.docNumber = { $regex: docNumber, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };

    // 🧍 2. Filter by uploader (denormalized user object)
    if (userName) filter['user.name'] = { $regex: userName, $options: 'i' };
    if (userEmail) filter['user.email'] = { $regex: userEmail, $options: 'i' };

    // 👤 3. Filter by current holder details
    if (currentHolderName) filter['custody.currentHolder.name'] = { $regex: currentHolderName, $options: 'i' };
    if (currentHolderEmail) filter['custody.currentHolder.email'] = { $regex: currentHolderEmail, $options: 'i' };

    // 📄 4. Filter by Final Certificate Status
    if (certificateStatus) filter['certificate.status'] = { $regex: certificateStatus, $options: 'i' };

    // ⏳ 5. Filter by "hasPendingResubmission" (boolean)
    if (typeof hasPendingResubmission !== 'undefined') {
      const value = hasPendingResubmission === 'true' || hasPendingResubmission === true;
      filter.hasPendingResubmission = value;
    }

    // 📅 6. Date range filter (createdAt)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full day
        filter.createdAt.$lte = end;
      }
    }

    // 🧩 Restrict regular admins to only assigned docs
    if (req.user.role === 'admin' && req.user.adminLevel === 'regular') {
      filter['assignedAdmins._id'] = req.user._id; // If The assignedAdmins array is an array of objects
      // filter.assignedAdmins = { $in: [req.user.email] }; ==> If The assignedAdmins array is just an array of strings
    }


    // 🔢 6. Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 📄 7. Query documents
    const documents = await Document.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

//           if (documents.assignedAdmins.length !== latestAssignment.assignedAdmins.length) {
//   documents.assignedAdmins = latestAssignment.assignedAdmins.map(a => a._id);
//   await documents.save();
// }

    const total = await Document.countDocuments(filter);

    // 🧾 8. Log action
    await Log.create({
      action: 'ListAllDocs',
      admin: {_id : req.user._id, name : req.user.name, email: req.user.email},
      message: `Admin ${req.user.name} with email ${req.user.email} viewed document list.`,
    });

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      documents,
    });
  } catch (error) {
    logger.error('Document Listing Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// 🟢 Submit certificate (first time)
exports.submitCertificate = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const files = req.files;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.status !== 'approved')
      return res.status(400).json({ message: 'Cannot submit certificate before full document approval' });

    if (doc.certificate.status !== 'none')
      return res.status(400).json({ message: 'Certificate already exists, use /resubmit instead' });

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No certificate images uploaded' });
    }

    if (doc.certificate && doc.certificate.status !== 'none') {
      return res.status(400).json({ message: 'Certificate already exists, use /resubmit instead' });
    }

    // const uploadedUrls = await uploadToCloudinary(files, `CLOA_Document_Reviewal_System/${doc.docType}_${doc.docNumber}_${doc.user.name}`);

        // 🟡 Upload each file to Cloudinary
    const uploadedUrls = [];
    const userName = doc.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadToCloudinary(
        file,
        `CLOA_Document_Reviewal_System/${doc.docType}_${doc.docNumber}_${userName}/Final_Certificate`,
        `final_certificate_${i + 1}`
      );
      uploadedUrls.push(url);
    }

    doc.certificate = {
      images: uploadedUrls,
      status: 'pending',
      uploadedBy: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminLevel: admin.adminLevel,
        phone: admin.phone,
      },
      uploadedAt: new Date(),
    };

    doc.activityLog.push({
      action: 'Final Certificate Submission',
      by: admin.name,
      role: admin.role,
      timestamp: new Date(),
    });

    await doc.save();

    // 🧾 8. Log action
    await Log.create({
      action: 'SubmitFinalCertificate',
      admin: {_id : admin._id, name : admin.name, email: admin.email},
      message: `Admin ${admin.name} with email ${admin.email} Has Submitted The Final Authorization Certificate For The Document ${doc.docType} With Number ${doc.docNumber}.`,
    });

    res.status(200).json({ message: 'Certificate submitted successfully and pending super admin review' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting certificate', error: err.message });
  }
};

// 🟡 Resubmit certificate (after rejection)
exports.resubmitCertificate = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const files = req.files;


    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.certificate.status !== 'rejected')
      return res.status(400).json({ message: 'Cannot resubmit unless previous certificate was rejected' });

    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No certificate images uploaded' });
    }

    // Optionally delete previous rejected certificate images from Cloudinary
    // const uploadedUrls = await uploadToCloudinary(files, `CLOA_Document_Reviewal_System/${doc.docType}_${doc.docNumber}_${doc.user.name}`);

    // 🟡 Delete previous rejected certificate folder from Cloudinary
try {
  const userName = doc.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
  const certFolder = `CLOA_Document_Reviewal_System/${doc.docType}_${doc.docNumber}_${userName}/Final_Certificate`;

  await deleteCloudinaryFolder(certFolder); // ✅ reuse the tested helper
  console.log('✅ Previous Final_Certificate folder deleted successfully');
} catch (err) {
  console.error('⚠️ Error deleting old certificate folder:', err.message);
}

        // 🟡 Upload each file to Cloudinary
    const uploadedUrls = [];
    const userName = doc.user?.name?.replace(/\s+/g, '') || 'UnknownUser';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadToCloudinary(
        file,
        `CLOA_Document_Reviewal_System/${doc.docType}_${doc.docNumber}_${userName}/Final_Certificate`,
        `final_certificate_${i + 1}`
      );
      uploadedUrls.push(url);
    }
    doc.certificate.images = uploadedUrls;
    doc.certificate.status = 'pending';
    doc.certificate.uploadedBy = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminLevel: admin.adminLevel,
      phone: admin.phone,
    };
    doc.certificate.uploadedAt = new Date();
    doc.certificate.comment = null;
    doc.certificate.approvedBy = null;
    doc.certificate.approvedAt = null;
    doc.activityLog.push({
      action: 'Final Certificate Re-Submission',
      by: admin.name,
      role: admin.role,
      timestamp: new Date(),
    });
    await doc.save();

    // 🧾 8. Log action
    await Log.create({
      action: 'ResubmitFinalCertificate',
      admin: {_id : admin._id, name : admin.name, email: admin.email},
      message: `Admin ${admin.name} with email ${admin.email} Attempted To  Re-Submit The Final Authorization Certificate For The Document ${doc.docType} With Number ${doc.docNumber}.`,
    });

    res.status(200).json({ message: 'Certificate resubmitted successfully and pending super admin review' });
  } catch (err) {
    res.status(500).json({ message: 'Error resubmitting certificate', error: err.message });
  }
};

// 🔵 Review certificate (Super Admin only)
exports.reviewCertificate = async (req, res) => {
  try {
    const superAdmin = req.user;
    const { id } = req.params;
    const { action, comment } = req.body;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.certificate.status !== 'pending')
      return res.status(400).json({ message: 'No pending certificate for this document' });

    if (action === 'approve') {
      doc.certificate.status = 'approved';
      doc.certificate.approvedBy = {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        adminLevel: superAdmin.adminLevel,
        phone: superAdmin.phone,
      };
      doc.certificate.approvedAt = new Date();
      doc.activityLog.push({
      action: 'Final Certificate Approval',
      by: superAdmin.name,
      role: superAdmin.role,
      timestamp: new Date(),
    });

      await doc.save();

      // TODO: send user email notification about approval

    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });
      
    const pdfBuffer = await generaterereviewPDFBuffer(doc, doc.certificate.status, superAdmin, comment,doc.certificate.images);
    const { subjectPrefix, htmlBody } = finalcertificatereviewsubmissionEmailTemplate(req.user, doc, doc.certificate.status, superAdmin, comment);

    
const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Sends an email using Brevo with optional PDF attachment
 */

  const emailData = {
    sender: {
      name: "CLOA Document Review System",
      email: process.env.EMAIL_USER
    },
    to: [{ email: doc.user.email }],
    subject:subjectPrefix,
    htmlContent: htmlBody,
        attachment: [{name: `Final-Certificate-Review-Summary-For-Document-${doc.docType}-With-Number-${doc.docNumber}.pdf`, content: pdfBuffer.toString("base64")}]
    // attachments: [{ filename: 'submission-summary.pdf', content: pdfBuffer }],
  };

  try {
    await brevoClient.sendTransacEmail(emailData);
    console.log(`📧 Email sent to ${doc.user.email}`);
  } catch (err) {
    console.error("📧 Brevo email failed:", err.response?.body || err.message);
  }

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: doc.user.email,
    //   subject: subjectPrefix,
    //   html: htmlBody,
    //   attachments: [{ filename: `Final-Certificate-Review-Summary-For-Document-${doc.docType}-With-Number-${doc.docNumber}.pdf`, content: pdfBuffer }],
    // });

      // 🧾 8. Log action
    await Log.create({
      action: 'ApproveFinalCertificate',
      admin: {_id : superAdmin._id, name : superAdmin.name, email: superAdmin.email},
      message: `Admin ${superAdmin.name} with email ${superAdmin.email} Has Approved The Final Authorization Certificate For The Document ${doc.docType} With Number ${doc.docNumber}.`,
    });
    
      return res.json({ message: 'Certificate approved successfully' });
    }

    if (action === 'reject') {
      doc.certificate.status = 'rejected';
      doc.certificate.comment = comment || 'No comment provided';
      doc.certificate.rejectedBy = {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        adminLevel: superAdmin.adminLevel,
        phone: superAdmin.phone,
      };
      doc.certificate.rejectedAt = new Date();
      doc.activityLog.push({
      action: 'Final Certificate Rejection',
      by: superAdmin.name,
      role: superAdmin.role,
      timestamp: new Date(),
    });
      await doc.save();

      // 🧾 8. Log action
    await Log.create({
      action: 'RejectFinalCertificate',
      admin: {_id : superAdmin._id, name : superAdmin.name, email: superAdmin.email},
      message: `Admin ${superAdmin.name} with email ${superAdmin.email} Has Rejected The Final Authorization Certificate For The Document ${doc.docType} With Number ${doc.docNumber}.`,
    });
      return res.json({ message: 'Certificate rejected successfully' });
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (err) {
    res.status(500).json({ message: 'Error reviewing certificate', error: err.message });
  }
};



// // PATCH /admin/documents/:id/certificate/review
// exports.reviewCertificate = async (req, res) => {
//   const superAdmin = req.admin;
//   const { id } = req.params;
//   const { action, comment } = req.body;

//   const document = await Document.findById(id);
//   if (!document) return res.status(404).json({ message: 'Document not found' });
//   if (document.certificate.status !== 'pending')
//     return res.status(400).json({ message: 'No pending certificate for this document' });

//   if (action === 'approve') {
//     document.certificate.status = 'approved';
//     document.certificate.approvedBy = {
//       _id: superAdmin._id,
//       name: superAdmin.name,
//       email: superAdmin.email,
//       role: superAdmin.role,
//       adminLevel: superAdmin.adminLevel,
//       phone: superAdmin.phone,
//     };
//     document.certificate.approvedAt = new Date();
//     await document.save();

//     // TODO: send email to document.user.email
//     res.json({ success: true, message: 'Certificate approved successfully' });
//   } else if (action === 'reject') {
//     document.certificate.status = 'rejected';
//     document.certificate.comment = comment || 'No comment provided';
//     await document.save();
//     res.json({ success: true, message: 'Certificate rejected successfully' });
//   } else {
//     res.status(400).json({ message: 'Invalid action' });
//   }
// };

