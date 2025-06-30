// routes/document.routes.js

const express = require('express');
const router = express.Router();
const upload = require('../utils/cloudinary'); // Multer+Cloudinary upload middleware
const { protect } = require('../middlewares/auth'); // JWT middleware
const Document = require('../models/document');
const Review = require('../models/review');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
// require('pdfkit-table'); // Must be called after pdfkit
const fs = require('fs'); // Optional for debugging
const Log = require('../models/log'); // make sure this is at the top


// @route   POST /api/documents/upload
// @desc    Upload a document with metadata
// @access  Private (Authenticated users only)
router.post('/upload', protect, upload.single('file'), async (req, res) => {
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

    // 3️⃣ Manual table PDF generator
    const generatePDFBuffer = () => {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const buffers = [];
      
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
      
        const submissionDate = new Date().toLocaleString();
      
        doc.fontSize(25).fillColor('#333').text('Document Submission Summary', {
          align: 'center',
          underline: true,
        });
      
        doc.moveDown(2);
      
        const rows = [
          ['User', req.user.name],
          ['Email', req.user.email],
          ['Document Title', document.title],
          ['Category', document.category || 'N/A'],
          ['File Name', document.fileName],
          ['Submission Date', submissionDate],
          ['Status', 'Pending Review'],
        ];
      
        doc.fontSize(16);
        const startX = doc.x;
        let y = doc.y;
      
        const labelWidth = 130;
        const valueWidth = 400;
        const rowHeight = 50;
      
        for (const [label, value] of rows) {
          doc
            .rect(startX, y, labelWidth + valueWidth, rowHeight)
            .fillAndStroke('#f0f0f0', '#ccc');
        
          doc.fillColor('#000')
            .font('Helvetica-Bold')
            .text(`${label}:`, startX + 10, y + 7, {
              width: labelWidth,
              align: 'left',
            });
          
          doc.font('Helvetica')
            .text(value, startX + 10 + labelWidth, y + 7, {
              width: valueWidth - 20,
              align: 'left',
            });
          
          y += rowHeight;
        }


        doc.x = 50;  // reset to left margin
        doc.y = y + 20; // position below the last row

      doc.moveDown(5);

      doc.fontSize(20).fillColor('#000').text('Thank you for submitting your document.', {
        align: 'left',
      });
      doc.text('You will be notified once the review is complete.', {
        align: 'left',
      });
      doc.moveDown();
      doc.text('Warm regards,', {
        align: 'left',
      });
      doc.font('Helvetica-Bold').text('The Document Review System Team', {
        align: 'left',
      });

      
        doc.end();
      });
    };


    const pdfBuffer = await generatePDFBuffer();

    // Optional: Save for debugging locally
    // fs.writeFileSync('submission-debug.pdf', pdfBuffer);

    // 4️⃣ Compose and send email
    const subject = `⏳ Document Submission Received – Pending Review`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="color: #f0ad4e; text-align: center;">⏳ Document Submitted – Pending Review</h2>

        <p>Dear <strong>${req.user.name}</strong>,</p>
        <p>Thank you for submitting your document <strong>"${document.title}"</strong>.</p>
        <p>Your file is currently <strong style="color:#f0ad4e;">pending review</strong>.</p>

        <hr style="margin: 20px 0;" />

        <ul style="list-style: none; padding: 0;">
          <li><strong>📄 Document Title:</strong> ${document.title}</li>
          <li><strong>📁 Category:</strong> ${document.category || 'N/A'}</li>
          <li><strong>⏱️ Status:</strong> Pending Review</li>
          <li><strong>📅 Submitted:</strong> ${new Date().toLocaleString()}</li>
        </ul>

        <hr style="margin: 20px 0;" />

        <p><strong>⏭️ What Happens Next:</strong></p>
        <ul>
          <li>You'll get another email after admin review.</li>
          <li>If approved, you're done. If rejected, you'll get helpful feedback.</li>
        </ul>

        <p>Thanks for using the <strong>Document Review System</strong>.</p>

        <p style="margin-top: 30px;">Warm regards,<br/><strong>The Document Review System Team</strong><br/><a href="#">yourdomain.com</a></p>
        <p style="font-size: 0.9em; color: #888;">Need help? Contact <a href="mailto:adhamsherif7261@gmail.com">adhamsherif7261@gmail.com</a></p>
      </div>
    `;

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
    console.error('Upload Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   POST /api/documents/:id/review
// @desc    Admin reviews a document
// @access  Private (Admins only)
router.post('/:id/review', protect, async (req, res) => {
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

    const generateReviewPDFBuffer = () => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const reviewedDate = new Date().toLocaleString();
    const isApproved = status === 'approved';

    doc.fontSize(25).font('Helvetica-Bold').fillColor('#333').text('Document Review Summary', {
      align: 'center',
      underline: true,
    });

    doc.moveDown(2);

    const rows = [
      ['User', document.user.name],
      ['Email', document.user.email],
      ['Document Title', document.title],
      ['Reviewed By', `${admin.name} (${admin.email})`],
      ['Review Date', reviewedDate],
      ['Status', isApproved ? 'Approved' : 'Rejected'],
      ...(comment ? [['Admin Comment', comment]] : []),
    ];

    doc.fontSize(16);
    const startX = doc.x;
    let y = doc.y;
    const labelWidth = 130;
    const valueWidth = 400;
    const rowHeight = 50;

    for (const [label, value] of rows) {
  const isStatusRow = label === 'Status';
  const isApprovedValue = value === 'Approved';
  const isRejectedValue = value === 'Rejected';

  // Draw cell background
  doc.rect(startX, y, labelWidth + valueWidth, rowHeight)
    .fillAndStroke('#f0f0f0', '#ccc');

  // Label
  doc.fillColor('#000')
    .font('Helvetica-Bold')
    .text(`${label}:`, startX + 10, y + 7, {
      width: labelWidth,
      align: 'left',
    });

  // Value (with conditional color for "Status" row)
  doc.font('Helvetica')
    .fillColor(isStatusRow
      ? isApprovedValue ? '#28a745'
      : isRejectedValue ? '#e74c3c'
      : '#000'
      : '#000')
    .text(value, startX + 10 + labelWidth, y + 7, {
      width: valueWidth - 20,
      align: 'left',
    });

  y += rowHeight;
}


    doc.x = 50;
    doc.y = y + 20;

    doc.moveDown(5);
    doc.fontSize(18).fillColor('#000')
      .text(isApproved
        ? 'Your document has been reviewed and approved successfully.'
        : 'Your document was reviewed and rejected. Please read the reviewer’s comment and consider re-submitting.'
      , { align: 'left' });

    doc.moveDown();
    doc.text('Warm regards,', { align: 'left' });
    doc.font('Helvetica-Bold').text('The Document Review System Team', { align: 'left' });

    doc.end();
  });
};

const pdfBuffer = await generateReviewPDFBuffer();


// 6️⃣ Send beautiful HTML email
const subjectPrefix = status === 'approved' ? '✅ Document Review Update – Approved' : '❌ Document Review Update – Action Required';

const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
    <h2 style="color: ${status === 'approved' ? '#28a745' : '#e74c3c'}; text-align: center;">
      ${status === 'approved' ? '✅ Document Approved' : '❌ Document Rejected'}
    </h2>

    <p>Dear <strong>${document.user.name}</strong>,</p>

    <p>We hope you're doing well.</p>

    <p>
      We wanted to inform you that your recent document submission has been reviewed by one of our administrators.
      ${status === 'approved' 
        ? `We’re happy to inform you that it <strong>meets all our criteria</strong> and has been marked as <strong style="color:#28a745;">APPROVED</strong>.`
        : `Unfortunately, the document <strong>did not meet the required criteria</strong> and has been marked as <strong style="color:#e74c3c;">REJECTED</strong>.`}
    </p>

    <hr style="margin: 20px 0;" />

    <p><strong>📄 Document Status:</strong> ${status === 'approved' ? '✅ Approved' : '❌ Rejected'}</p>
    <p><strong>👤 Reviewed By:</strong> ${admin.name} (${admin.email})</p>
    ${comment ? `
      <p><strong>📝 Comment from Reviewer:</strong></p>
      <blockquote style="margin: 10px 0; padding: 10px; background-color: #fffbe6; border-left: 4px solid ${status === 'approved' ? '#28a745' : '#e74c3c'};">
        <em>${comment}</em>
      </blockquote>
    ` : ''}

    <hr style="margin: 20px 0;" />

    ${status === 'approved' 
      ? `
        <p>🎉 Your document has been successfully reviewed and approved. You may now proceed with the next steps in your process.</p>
      `
      : `
        <p>But don’t worry — you're welcome to revise and <strong>resubmit your document</strong> at any time. If you need guidance or clarification, we’re here to help.</p>
        
        <p><strong>🔄 Next Steps:</strong></p>
        <ul style="padding-left: 20px;">
          <li>Review the admin comment above.</li>
          <li>Make the necessary changes to your document.</li>
          <li>Log in and upload the updated version for a new review.</li>
        </ul>
      `
    }

    <hr style="margin: 20px 0;" />

    <p>Thank you for using the <strong>Document Review System</strong>. We’re committed to helping you get your work approved efficiently and professionally.</p>

    <p style="margin-top: 30px;">
      Warm regards,<br/>
      <strong>The Document Review System Team</strong><br/>
      <a href="https://yourdomain.com" style="color: #4A90E2;">yourdomain.com</a>
    </p>
    
    <p style="margin-top: 10px; font-size: 0.9em; color: #888;">Need help? Contact us at <a href="mailto:adhamsherif7261@gmail.com">adhamsherif7261@gmail.com</a></p>
  </div>
`;

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
    const Log = require('../models/log');
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
    console.error('Review Error:', error.message);
    res.status(500).json({ message: 'Server error during review' });
  }
});



// @route   PUT /api/documents/:id/resubmit
// @desc    User re-submits a rejected or pending document
// @access  Private (Authenticated users only)
router.put('/:id/resubmit', protect, upload.single('file'), async (req, res) => {
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

    // ✅ Generate the PDF
    const generatePDFBuffer = () => {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const submissionDate = new Date().toLocaleString();

        doc.fontSize(25).fillColor('#333').text('Document Re-Submission Summary', {
          align: 'center',
          underline: true,
        });

        doc.moveDown(2);

        const rows = [
          ['User', req.user.name],
          ['Email', req.user.email],
          ['Document Title', document.title],
          ['Category', document.category || 'N/A'],
          ['File Name', document.fileName],
          ['Re-Submission Date', submissionDate],
          ['Status', 'Pending Review'],
        ];

        doc.fontSize(16);
        const startX = doc.x;
        let y = doc.y;
        const labelWidth = 130;
        const valueWidth = 400;
        const rowHeight = 50;

        for (const [label, value] of rows) {
          doc.rect(startX, y, labelWidth + valueWidth, rowHeight)
            .fillAndStroke('#f0f0f0', '#ccc');

          doc.fillColor('#000')
            .font('Helvetica-Bold')
            .text(`${label}:`, startX + 10, y + 7, {
              width: labelWidth,
              align: 'left',
            });

          doc.font('Helvetica')
            .text(value, startX + 10 + labelWidth, y + 7, {
              width: valueWidth - 20,
              align: 'left',
            });

          y += rowHeight;
        }

        doc.x = 50;
        doc.y = y + 20;

        doc.moveDown(5);
        doc.fontSize(18).fillColor('#000')
          .text('Thank you for re-submitting your document.', { align: 'left' });
        doc.text('You will be notified once the review is complete.', { align: 'left' });
        doc.moveDown();
        doc.text('Warm regards,', { align: 'left' });
        doc.font('Helvetica-Bold').text('The Document Review System Team', { align: 'left' });

        doc.end();
      });
    };

    const pdfBuffer = await generatePDFBuffer();

    // ✅ Send Re-submission Email
    const subject = `📤 Document Re-Submission Received – Pending Review`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="color: #4A90E2; text-align: center;">📤 Document Re-Submitted – Pending Review</h2>

        <p>Dear <strong>${req.user.name}</strong>,</p>
        <p>We’ve received your updated document titled <strong>"${document.title}"</strong>.</p>

        <p>Our team will review your re-submission shortly. The document is currently <strong style="color:#f0ad4e;">pending review</strong>.</p>

        <hr style="margin: 20px 0;" />

        <ul style="list-style: none; padding: 0;">
          <li><strong>📄 Document Title:</strong> ${document.title}</li>
          <li><strong>📁 Category:</strong> ${document.category || 'N/A'}</li>
          <li><strong>📅 Re-Submitted:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>📌 Status:</strong> Pending Review</li>
        </ul>

        <hr style="margin: 20px 0;" />

        <p><strong>⏭️ What Happens Next:</strong></p>
        <ul>
          <li>You'll get an email when the document is reviewed.</li>
          <li>If approved, you're done. If rejected again, you'll receive feedback.</li>
        </ul>

        <p>Thanks for re-engaging with the <strong>Document Review System</strong>.</p>

        <p style="margin-top: 30px;">Warm regards,<br/><strong>The Document Review System Team</strong><br/><a href="#">yourdomain.com</a></p>
        <p style="font-size: 0.9em; color: #888;">Need help? Contact <a href="mailto:adhamsherif7261@gmail.com">adhamsherif7261@gmail.com</a></p>
      </div>
    `;

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
    console.error('Resubmission Error:', error.message);
    res.status(500).json({ message: 'Server error during resubmission' });
  }
});


// @route   GET /api/documents
// @desc    Admin view of all documents with filters, search & pagination
// @access  Private (Admins only)
router.get('/', protect, async (req, res) => {
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
    console.error('Document Listing Error:', error.message);
    res.status(500).json({ message: 'Server error while listing documents' });
  }
});


module.exports = router;
