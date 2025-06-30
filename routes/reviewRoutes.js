const express = require('express');
const router = express.Router();
const { getAdminReviews } = require('../controllers/reviewController');
const { protect, isAdmin } = require('../middlewares/auth');

router.get('/admin', protect, isAdmin, getAdminReviews);

module.exports = router;
