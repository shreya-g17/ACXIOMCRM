const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies JWT from httpOnly cookie or Authorization header.
 * Attaches `req.user` with the full user document (minus password).
 */
const protect = async (req, res, next) => {
  try {
    // 1. Read token from cookie first, then Authorization header
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is inactive.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * authorize — restricts access to specified roles.
 * Usage: authorize('Admin', 'Manager')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}.`
    });
  }
  next();
};

module.exports = { protect, authorize };
