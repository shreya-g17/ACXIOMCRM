const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, logout, getMe, register } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// 10 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } });

router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/register', protect, authorize('Admin'), register);

module.exports = router;
