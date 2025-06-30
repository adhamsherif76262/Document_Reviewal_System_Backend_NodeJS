const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const { getLogs } = require('../controllers/log.controller');

router.get('/', protect, isAdmin, getLogs);

module.exports = router;
