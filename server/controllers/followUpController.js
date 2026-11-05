const FollowUp = require('../models/FollowUp');
const { writeAudit } = require('../middleware/auditLogger');
const { textFilter } = require('../utils/search');

/** Compare a date-only value (YYYY-MM-DD or Date) against the local calendar day. */
const isBeforeToday = (value) => {
  if (!value) return true;
  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  const picked = Number.isFinite(y) ? new Date(y, m - 1, d) : new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  picked.setHours(0, 0, 0, 0);
  return picked < today;
};

exports.getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (req.user.role === 'Sales Executive') filter.assignedTo = req.user._id;
    if (status) filter.status = status;
    const text = textFilter(search, ['subject']);
    if (text) Object.assign(filter, text);
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;
    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('customer', 'customerName')
        .populate('lead', 'leadName')
        .populate('assignedTo', 'fullName')
        .sort({ followUpDate: 1 })
        .skip(skip).limit(pageSize),
      FollowUp.countDocuments(filter),
    ]);
    res.json({ success: true, data: followUps, total, page: currentPage, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const f = await FollowUp.findById(req.params.id)
      .populate('customer', 'customerName').populate('lead', 'leadName').populate('assignedTo', 'fullName');
    if (!f) return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    if (req.user.role === 'Sales Executive' && String(f.assignedTo?._id || f.assignedTo) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, data: f });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Planned follow-ups cannot be scheduled before today (date-only, local calendar)
    const planned = !req.body.status || req.body.status === 'Planned';
    if (planned && isBeforeToday(req.body.followUpDate))
      return res.status(400).json({ success: false, message: 'Follow-up date cannot be in the past for planned activities.' });

    const {
      subject, followUpDate, followUpType, status: followUpStatus, notes, customer, lead,
    } = req.body;
    const assignedTo = req.user.role === 'Sales Executive'
      ? req.user._id
      : (req.body.assignedTo || req.user._id);
    const followUp = await FollowUp.create({
      subject, followUpDate, followUpType, status: followUpStatus, notes, customer, lead, assignedTo,
    });
    await writeAudit({ action: 'Create', entityName: 'FollowUp', recordId: followUp._id, newValue: { subject: followUp.subject }, req });
    res.status(201).json({ success: true, data: followUp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await FollowUp.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    if (req.user.role === 'Sales Executive' && String(existing.assignedTo) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    const payload = { ...req.body };
    ['customer', 'lead', 'assignedTo'].forEach((key) => { if (!payload[key]) delete payload[key]; });
    if (req.user.role === 'Sales Executive') {
      payload.assignedTo = req.user._id;
    }
    const nextStatus = payload.status || existing.status;
    const nextDate = payload.followUpDate || existing.followUpDate;
    if (nextStatus === 'Planned' && isBeforeToday(nextDate))
      return res.status(400).json({ success: false, message: 'Follow-up date cannot be in the past for planned activities.' });
    const updated = await FollowUp.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    await writeAudit({ action: 'Update', entityName: 'FollowUp', recordId: existing._id, req });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const f = await FollowUp.findById(req.params.id);
    if (!f) return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    if (req.user.role === 'Sales Executive' && String(f.assignedTo) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    await f.deleteOne();
    await writeAudit({ action: 'Delete', entityName: 'FollowUp', recordId: req.params.id, req });
    res.json({ success: true, message: 'Follow-up deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
