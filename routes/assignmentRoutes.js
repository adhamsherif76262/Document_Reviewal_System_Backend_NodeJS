// routes/assignmentRoutes.js
const express = require('express');
const {
  syncDocTypeAssignments,
  getDocTypeAssignments
} = require('../controllers/assignmentController');
const  {isSuperAdmin , protect} =require ('../middlewares/auth');

const router = express.Router();

// Only superadmins or authorized admins should access these routes
router.post('/sync',protect, isSuperAdmin, syncDocTypeAssignments);
router.get('/',protect, isSuperAdmin, getDocTypeAssignments);

module.exports = router;
