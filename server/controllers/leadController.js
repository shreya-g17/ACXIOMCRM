const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');
const { writeAudit } = require('../middleware/auditLogger');
const { textFilter } = require('../utils/search');
const mongoose = require('mongoose');

const owns = (req, assignedTo) =>
  req.user.role !== 'Sales Executive' || String(assignedTo?._id || assignedTo) === String(req.user._id);

exports.getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (req.user.role === 'Sales Executive') filter.assignedTo = req.user._id;
    if (status) filter.status = status;
    const text = textFilter(search, ['leadName', 'email', 'phone', 'companyName', 'leadCode']);
    if (text) Object.assign(filter, text);

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;
    const [leads, total] = await Promise.all([
      Lead.find(filter).populate('assignedTo', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Lead.countDocuments(filter),
    ]);
    res.json({ success: true, data: leads, total, page: currentPage, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'fullName').populate('convertedCustomer convertedOpportunity');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    if (req.user.role === 'Sales Executive' && String(lead.assignedTo?._id || lead.assignedTo) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const count = await Lead.countDocuments();
    const leadCode = `LEAD-${String(count + 1).padStart(3, '0')}`;
    const { leadName, email, phone, companyName, source, status, expectedValue, notes } = req.body;
    const assignedTo = req.user.role === 'Sales Executive'
      ? req.user._id
      : (req.body.assignedTo || req.user._id);
    const lead = await Lead.create({
      leadCode, leadName, email, phone, companyName, source, status, expectedValue, notes, assignedTo,
    });
    await writeAudit({ action: 'Create', entityName: 'Lead', recordId: lead._id, newValue: { leadName: lead.leadName }, req });
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    if (!owns(req, lead.assignedTo))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (lead.status === 'Converted')
      return res.status(409).json({ success: false, message: 'A converted lead cannot be changed.' });
    const payload = { ...req.body };
    if (req.user.role === 'Sales Executive') payload.assignedTo = req.user._id;
    else if (!payload.assignedTo) delete payload.assignedTo;
    delete payload.leadCode;
    delete payload.convertedCustomer;
    delete payload.convertedOpportunity;
    delete payload.convertedAt;
    if (payload.status === 'Converted')
      return res.status(400).json({ success: false, message: 'Use the conversion action to convert a lead.' });
    const updated = await Lead.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    await writeAudit({ action: 'Update', entityName: 'Lead', recordId: lead._id, req });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    if (!owns(req, lead.assignedTo))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (lead.status === 'Converted')
      return res.status(409).json({ success: false, message: 'A converted lead cannot be deleted.' });
    await lead.deleteOne();
    await writeAudit({ action: 'Delete', entityName: 'Lead', recordId: req.params.id, req });
    res.json({ success: true, message: 'Lead deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

/**
 * POST /api/leads/:id/convert
 * Creates a Customer and an Opportunity from the lead.
 * Uses a MongoDB transaction when the server is a replica set, and falls back
 * to sequential writes with compensating deletes on a standalone local MongoDB.
 */
exports.convertLead = async (req, res) => {
  const build = async (session) => {
    const leadQuery = Lead.findById(req.params.id);
    if (session) leadQuery.session(session);
    const lead = await leadQuery;
    if (!lead) throw Object.assign(new Error('Lead not found.'), { status: 404 });
    if (lead.status === 'Converted') throw Object.assign(new Error('Lead has already been converted.'), { status: 409 });
    if (req.user.role === 'Sales Executive' && String(lead.assignedTo) !== String(req.user._id))
      throw Object.assign(new Error('Access denied.'), { status: 403 });

    const { customerName, customerCode, city, state, opportunityName, amount, probability, expectedCloseDate } = req.body;
    if (!amount || Number(amount) <= 0) throw Object.assign(new Error('Opportunity amount must be greater than 0.'), { status: 400 });
    if (probability !== undefined && (Number(probability) < 0 || Number(probability) > 100))
      throw Object.assign(new Error('Probability must be between 0 and 100.'), { status: 400 });
    if (isBeforeToday(expectedCloseDate))
      throw Object.assign(new Error('Expected close date cannot be in the past.'), { status: 400 });

    const opts = session ? { session } : {};
    const [customer] = await Customer.create([{
      customerCode: customerCode || `CUS-${Date.now()}`,
      customerName: customerName || lead.leadName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      city, state, status: 'Active',
      owner: req.user._id,
    }], opts);

    const [opportunity] = await Opportunity.create([{
      opportunityName: opportunityName || `${lead.leadName} - Opportunity`,
      customer: customer._id,
      lead: lead._id,
      amount: Number(amount),
      stage: 'Qualification',
      status: 'Open',
      probability: Number(probability) || 50,
      expectedCloseDate: new Date(expectedCloseDate),
      owner: req.user._id,
    }], opts);

    lead.status = 'Converted';
    lead.convertedCustomer = customer._id;
    lead.convertedOpportunity = opportunity._id;
    lead.convertedAt = new Date();
    await lead.save(opts);
    return { lead, customer, opportunity };
  };

  const respond = async ({ lead, customer, opportunity }) => {
    await writeAudit({ action: 'ConvertLead', entityName: 'Lead', recordId: lead._id, description: `Lead converted to Customer ${customer.customerName}`, req });
    res.json({ success: true, message: 'Lead converted successfully!', customer, opportunity });
  };

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await build(session);
    await session.commitTransaction();
    session.endSession();
    return respond(result);
  } catch (err) {
    if (session) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
    }
    const needsFallback = /replica set|Transaction numbers/i.test(err.message || '');
    if (!needsFallback) {
      const code = err.code === 11000 ? 409 : (err.status || 400);
      const message = err.code === 11000 ? 'A customer with this email or phone already exists.' : err.message;
      return res.status(code).json({ success: false, message });
    }
    try {
      return respond(await build(null));
    } catch (fallbackErr) {
      const code = fallbackErr.code === 11000 ? 409 : (fallbackErr.status || 400);
      const message = fallbackErr.code === 11000 ? 'A customer with this email or phone already exists.' : fallbackErr.message;
      return res.status(code).json({ success: false, message });
    }
  }
};
