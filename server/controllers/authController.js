const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { writeAudit } = require('../middleware/auditLogger');

// ── Helper: sign token and send httpOnly cookie ───────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
  });

  res.status(statusCode).json({
    success: true,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    // 1. Find user (include password field for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      await writeAudit({ action: 'LoginFailed', entityName: 'Auth', description: `Failed login for ${email}`, req });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 2. Check lockout (5 failed attempts → 15 min lockout)
    if (user.isLockedOut) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
      });
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        user.failedLoginAttempts = 0;
        await user.save({ validateBeforeSave: false });
        await writeAudit({ action: 'AccountLocked', entityName: 'Auth', recordId: user._id, description: `${user.email} locked after repeated failures`, req });
        return res.status(423).json({ success: false, message: 'Account locked for 15 minutes.' });
      }
      await user.save({ validateBeforeSave: false });
      await writeAudit({ action: 'LoginFailed', entityName: 'Auth', recordId: user._id, description: `Bad password for ${user.email}`, req });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 4. Reset failed attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });

    await writeAudit({ action: 'Login', entityName: 'Auth', recordId: user._id, description: `${user.fullName} logged in`, req });
    sendToken(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  await writeAudit({ action: 'Logout', entityName: 'Auth', recordId: req.user?._id, req });
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out.' });
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── POST /api/auth/register (Admin only) ─────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, department } = req.body;
    if (!fullName?.trim() || !email?.trim() || !password)
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (role && !['Admin', 'Manager', 'Sales Executive'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid user role.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ success: false, message: 'Email already in use.' });

    const user = await User.create({ fullName, email, password, role: role || 'Sales Executive', department });

    await writeAudit({
      action: 'Create', entityName: 'User', recordId: user._id,
      newValue: { fullName, email, role }, description: `New user created: ${fullName}`, req
    });

    res.status(201).json({ success: true, message: `User ${fullName} created.`, userId: user._id });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};
