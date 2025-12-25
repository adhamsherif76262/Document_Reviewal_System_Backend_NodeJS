const express = require('express');
const router = express.Router();
const { protect, isAdmin ,isSuperAdmin} = require('../middlewares/auth');
const { getLogs } = require('../controllers/log.controller');
const Log = require('../models/log');

router.get("/:id/getLogById", protect, isAdmin, async (req, res) => {
  try {
    const ID = req.params.id;
    // const user = await User.findById(req.params.id);
    if (!ID) {
        return res.status(401).json({ message: 'Invalid log ID' });
    }
    const log = await Log.findById(ID);
    if (!log) {
        console.log('❌ log not found in DB');
        return res.status(401).json({ message: 'Invalid log ID' });
    }
    // if (!user.isVerified && user.role === "user") {
    //   return res.status(403).json({ message: `Please Make Sure That The User's Account Is Verified Before Attempting To Extend The Account's Expiry Date.` });
    // }
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error while retrieving log data' });
  }
});
router.get('/', protect, isSuperAdmin, getLogs);

module.exports = router;
