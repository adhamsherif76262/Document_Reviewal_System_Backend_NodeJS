const express = require('express');
const router = express.Router();
const { getAdminReviews } = require('../controllers/reviewController');
const { protect, isAdmin } = require('../middlewares/auth');
const Review = require('../models/review');

router.get("/:id/getReviewById", protect, async (req, res) => {
  try {
    const ID = req.params.id;
    // const user = await User.findById(req.params.id);
    const review = await Review.findById(ID);
    if (!review) {
      console.log('❌ review not found in DB');
      return res.status(401).json({ message: 'Invalid review ID' });
    }
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error while retrieving review data' });
  }
});

router.get('/admin', protect, isAdmin, getAdminReviews);

module.exports = router;
