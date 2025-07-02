// routes/document.routes.js

const express = require('express');
const router = express.Router();
const upload = require('../utils/cloudinary'); // Multer+Cloudinary upload middleware
const { protect } = require('../middlewares/auth'); // JWT middleware

const {
  uploadDocument,
  reviewDocument,
  resubmitDocument,
  adminListDocuments
} = require('../controllers/document.controller');

const {
  validateDocumentUpload,
  validateResubmission,
  validateDocumentReview,
} = require('../middlewares/validation');

router.post('/upload', protect, upload.single('file'),validateDocumentUpload, uploadDocument);
router.post('/:id/review', protect,validateDocumentReview, reviewDocument);
router.put('/:id/resubmit', protect, upload.single('file'),validateResubmission, resubmitDocument);
router.get('/', protect, adminListDocuments); // Admin route

module.exports = router;
