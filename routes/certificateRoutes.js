const express = require('express');
const {
  submitCertificate,
  resubmitCertificate,
  reviewCertificate
} = require('../controllers/document.controller');
const { isAdmin, isSuperAdmin , protect} = require('../middlewares/auth');
const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });
const upload = multer();
const router = express.Router();

// Regular admin uploads
router.post('/:id/submitfinalcertificate', protect, isAdmin, upload.array('certificateImages', 5), submitCertificate);
router.post('/:id/resubmitfinalcertificate', protect, isAdmin,upload.array('certificateImages', 5), resubmitCertificate);

// Super admin review
router.patch('/:id/reviewfinalcertificate',protect, isSuperAdmin, reviewCertificate);

module.exports = router;
