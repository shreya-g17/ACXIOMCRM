const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { writeAudit } = require('../middleware/auditLogger');
const { textFilter } = require('../utils/search');

exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const filter = textFilter(search, ['fullName', 'email']) || {};
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total, page: currentPage, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (String(user._id) === String(req.user._id) && req.body.role && req.body.role !== 'Admin')
      return res.status(400).json({ success: false, message: 'You cannot remove your own administrator role.' });
    const removingAdminAccess = user.role === 'Admin'
      && (req.body.role && req.body.role !== 'Admin' || req.body.isActive === false);
    if (removingAdminAccess) {
      const activeAdmins = await User.countDocuments({ role: 'Admin', isActive: true, _id: { $ne: user._id } });
      if (activeAdmins === 0)
        return res.status(400).json({ success: false, message: 'The last active administrator cannot be disabled or demoted.' });
    }
    if (String(user._id) === String(req.user._id) && req.body.isActive === false)
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    const updates = ['fullName', 'email', 'role', 'department', 'isActive'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    await user.save();
    await writeAudit({ action: 'Update', entityName: 'User', recordId: user._id, description: `${user.fullName} updated`, req });
    res.json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (String(user._id) === String(req.user._id))
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    if (user.isActive && user.role === 'Admin') {
      const activeAdmins = await User.countDocuments({ role: 'Admin', isActive: true, _id: { $ne: user._id } });
      if (activeAdmins === 0)
        return res.status(400).json({ success: false, message: 'The last active administrator cannot be deactivated.' });
    }
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    await writeAudit({ action: user.isActive ? 'Activate' : 'Deactivate', entityName: 'User', recordId: user._id, req });
    res.json({ success: true, isActive: user.isActive, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    await writeAudit({ action: 'PasswordReset', entityName: 'User', recordId: user._id, description: `Password reset for ${user.fullName}`, req });
    res.json({ success: true, message: `Password reset for ${user.fullName}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const filter = textFilter(search, ['action', 'entityName', 'description']) || {};
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 25));
    const skip = (currentPage - 1) * pageSize;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: logs, total, page: currentPage, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
