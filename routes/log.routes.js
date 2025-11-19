const express = require('express');
const router = express.Router();
const { protect, isAdmin ,isSuperAdmin} = require('../middlewares/auth');
const { getLogs } = require('../controllers/log.controller');

router.get('/', protect, isSuperAdmin, getLogs);

module.exports = router;
