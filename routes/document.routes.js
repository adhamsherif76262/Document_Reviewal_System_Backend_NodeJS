// routes/document.routes.js

const express = require('express');
const router = express.Router();
// const upload = require('../utils/cloudinary'); // Multer+Cloudinary upload middleware
const { protect , isAdmin, isSuperAdmin} = require('../middlewares/auth'); // JWT middleware
const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });
const upload = multer();

const {
  // uploadDocument,
  createDocument,
  reviewDocument,
  resubmitDocument,
  adminListDocuments
} = require('../controllers/document.controller');

const {
  validateDocumentUpload,
  validateResubmission,
  validateDocumentReview,
} = require('../middlewares/validation');

router.post('/upload',
  protect,
  upload.any(), 
  validateDocumentUpload,
   createDocument);
// router.post('/upload', protect, upload.single('file'),validateDocumentUpload, uploadDocument);
router.post('/:id/review', protect,validateDocumentReview , isAdmin, reviewDocument);
router.patch('/:id/resubmit', protect,validateResubmission,
  upload.any(), (req, res, next) => {
  console.log('📦 Files:', req.files);
  console.log('🧠 Body:', req.body);
  next();
},
  resubmitDocument);
// router.put('/:id/resubmit', protect,validateResubmission, resubmitDocument);
// router.put('/:id/resubmit', protect, upload.single('file'),validateResubmission, resubmitDocument);
router.get('/', protect,isAdmin, adminListDocuments); // Admin route

module.exports = router;
