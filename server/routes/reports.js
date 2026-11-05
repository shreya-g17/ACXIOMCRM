const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
router.get('/', protect, authorize('Admin', 'Manager'), getReports);
module.exports = router;
