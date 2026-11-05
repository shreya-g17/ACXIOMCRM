const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Active users for assignment dropdowns. Available to every signed-in role.
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('fullName email role').sort({ fullName: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
