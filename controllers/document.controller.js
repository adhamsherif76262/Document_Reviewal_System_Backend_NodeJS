// controllers/document.controller.js

const Document = require('../models/document');
const Review = require('../models/review');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const fs = require('fs'); // Optional for debugging
const Log = require('../models/log'); // make sure this is at the top
const logger = require('../utils/logger');

const generateSubmissionPDFBuffer = require('../utils/pdfTemplates/submission');
const generatereSubmissionPDFBuffer = require('../utils/pdfTemplates/resubmission');
const generaterereviewPDFBuffer = require('../utils/pdfTemplates/review');

const submissionEmailTemplate = require('../utils/emailTemplates/submission');
const resubmissionEmailTemplate = require('../utils/emailTemplates/resubmission');
const reviewsubmissionEmailTemplate = require('../utils/emailTemplates/review');

// @route   POST /api/documents/upload
// @desc    Upload a document with metadata
// @access  Private (Authenticated users only)
exports.uploadDocument = async (req, res) => {
  try {
      const file = req.file;
      const { title, description, category } = req.body;
  
      if (!file) return res.status(400).json({ message: 'No file uploaded' });
      if (!title) return res.status(400).json({ message: 'Title is required' });
  
      // 1️⃣ Save document
      const document = await Document.create({
        user: req.user,
        fileUrl: file.path,
        fileName: file.originalname,
        title,
        description,
        category,
      });
  
      // 2️⃣ Log action
      await Log.create({
        action: 'fileSubmission',
        user: req.user,
        document,
        message: `User ${req.user.name} with email ${req.user.email} submitted a file.`,
      });

      const pdfBuffer = await generateSubmissionPDFBuffer(req.user, document);
  
      const { subject, htmlBody } = submissionEmailTemplate(req.user, document);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: req.user.email,
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: 'submission-summary.pdf',
            content: pdfBuffer,
          },
        ],
      });
  
      // 5️⃣ Respond
      res.status(201).json({
        message: 'Document uploaded successfully',
        document,
      });

    } catch (error) {
    logger.error('Upload Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/documents/:id/review
// @desc    Admin reviews a document
// @access  Private (Admins only)
exports.reviewDocument = async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can review documents' });
    }

    const document = await Document.findById(req.params.id).populate('user');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (!document.user) {
      return res.status(404).json({ message: 'Associated user To The Document not found' });
    }

    // 1️⃣ Update document
    document.status = status;
    if (comment) document.adminComment = comment;
    await document.save();

    // 2️⃣ Create review entry
    const review = await Review.create({
      document: document,
      reviewedBy: req.user,
      status,
      comment,
    });

    // 3️⃣ Fetch admin full info
    const admin = await User.findById(req.user._id);

    // 4️⃣ Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


const pdfBuffer = await generaterereviewPDFBuffer(document, status, admin, comment);

const { subjectPrefix, htmlBody } = reviewsubmissionEmailTemplate(req.user, document, status, admin, comment);

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: document.user.email,
  subject: subjectPrefix,
  html: htmlBody,
  attachments: [
    {
      filename: 'review-summary.pdf',
      content: pdfBuffer,
    },
  ],
});


    // 7️⃣ Audit log

    await Log.create({
      action: status === 'approved' ? 'approve' : 'reject',
      admin: req.user,
      document: document,
      message: `Document ${status} by ${req.user.name}`,
    });

    // 8️⃣ Respond
    res.status(200).json({
      message: `Document ${status} successfully and user notified`,
      review,
    });

  } catch (error) {
    logger.error('Review Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /api/documents/:id/resubmit
// @desc    User re-submits a rejected or pending document
// @access  Private (Authenticated users only)
exports.resubmitDocument = async (req, res) => {
  try {
    const file = req.file;
    const { title, description, category } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only resubmit your own documents' });
    }

    if (document.status === 'approved') {
      return res.status(400).json({ message: 'Only pending or rejected documents can be resubmitted' });
    }

    if (file) {
      document.fileUrl = file.path;
      document.fileName = file.originalname;
    }
    if (title) document.title = title;
    if (description) document.description = description;
    if (category) document.category = category;

    document.status = 'pending';
    document.adminComment = undefined;
    await document.save();

    await Log.create({
      action: 'fileReSubmission',
      user: req.user,
      document,
      message: `User ${req.user.name} With Email ${req.user.email} Attempted A File Re-Submission`,
    });

    const pdfBuffer = await generatereSubmissionPDFBuffer(req.user, document);

    const { subject, htmlBody } = resubmissionEmailTemplate(req.user, document);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: 'resubmission-summary.pdf',
          content: pdfBuffer,
        },
      ],
    });

    // ✅ Final Response
    res.json({
      message: 'Document resubmitted successfully and is pending review',
      document,
    });
  } catch (error) {
    logger.error('Resubmission Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/documents
// @desc    Admin view of all documents with filters, search & pagination
// @access  Private (Admins only)
exports.adminListDocuments = async (req, res) => {
  try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can view all documents' });
      }
  
      const {
        status,
        category,
        fileName,
        userName,
        userEmail,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;
  
      const filter = {};
  
      // 1. Filter by status and category
      if (status) filter.status = status;
      if (category) filter.category = category;
  
      // 2. Search by file name
      if (fileName) {
        filter.fileName = { $regex: fileName, $options: 'i' };
      }
  
      // 3. Filter by uploader name/email (for denormalized user object)
        if (userName || userEmail) {
          if (userName) {
            filter['user.name'] = { $regex: userName, $options: 'i' };
          }
          if (userEmail) {
            filter['user.email'] = { $regex: userEmail, $options: 'i' };
          }
        }
  
  
      // 4. Date range filter (createdAt)
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include entire day
          filter.createdAt.$lte = end;
        }
      }
  
      // 5. Pagination
      const skip = (Number(page) - 1) * Number(limit);
  
      // 6. Query documents
      const documents = await Document.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
  
      const total = await Document.countDocuments(filter);
  
      res.status(200).json({
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        documents,
      });
    } catch (error) {
    logger.error('Document Listing Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
