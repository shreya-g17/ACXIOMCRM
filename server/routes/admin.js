const express = require('express');
const router = express.Router();
const { getUsers, updateUser, toggleActive, resetPassword, getAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('Admin'));
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.patch('/users/:id/toggle', toggleActive);
router.patch('/users/:id/reset-password', resetPassword);
router.get('/audit-logs', getAuditLogs);
module.exports = router;
