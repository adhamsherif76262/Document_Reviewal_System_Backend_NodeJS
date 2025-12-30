// routes/document.routes.js

const express = require('express');
const router = express.Router();
// const upload = require('../utils/cloudinary'); // Multer+Cloudinary upload middleware
const { protect , isAdmin, isSuperAdmin} = require('../middlewares/auth'); // JWT middleware
const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });
const upload = multer();
const Doc = require('../models/document');
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

router.get("/:id/getDocumentById", protect, async (req, res) => {
  try {
    const ID = req.params.id;
    // const user = await User.findById(req.params.id);
    const doc = await Doc.findById(ID);
    if (!doc) {
      console.log('❌ doc not found in DB');
      return res.status(401).json({ message: 'Invalid doc ID' });
    }
    // if (!user.isVerified && user.role === "user") {
    //   return res.status(403).json({ message: `Please Make Sure That The User's Account Is Verified Before Attempting To Extend The Account's Expiry Date.` });
    // }
    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error while retrieving doc data' });
  }
});

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
