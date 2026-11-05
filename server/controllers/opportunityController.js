const Opportunity = require('../models/Opportunity');
const { writeAudit } = require('../middleware/auditLogger');
const { textFilter } = require('../utils/search');

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
    const { search, stage, status, page = 1, limit = 10 } = req.query;
    const accessFilter = req.user.role === 'Sales Executive' ? { owner: req.user._id } : {};
    const filter = { ...accessFilter };
    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    const text = textFilter(search, ['opportunityName', 'description']);
    if (text) Object.assign(filter, text);

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;
    const [opportunities, total, pipelineAgg] = await Promise.all([
      Opportunity.find(filter).populate('customer', 'customerName').populate('owner', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Opportunity.countDocuments(filter),
      Opportunity.aggregate([{ $match: { ...accessFilter, status: 'Open' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const pipelineValue = pipelineAgg[0]?.total || 0;
    res.json({ success: true, data: opportunities, total, page: currentPage, totalPages: Math.ceil(total / pageSize), pipelineValue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id).populate('customer', 'customerName email').populate('owner', 'fullName');
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    if (req.user.role === 'Sales Executive' && String(opp.owner?._id || opp.owner) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, data: opp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { amount, probability, expectedCloseDate, stage } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    if (probability !== undefined && (Number(probability) < 0 || Number(probability) > 100))
      return res.status(400).json({ success: false, message: 'Probability must be between 0 and 100.' });
    if (isBeforeToday(expectedCloseDate))
      return res.status(400).json({ success: false, message: 'Expected close date cannot be in the past.' });

    const payload = {
      opportunityName: req.body.opportunityName,
      customer: req.body.customer,
      lead: req.body.lead,
      amount: Number(amount),
      stage: req.body.stage,
      status: req.body.status,
      probability: probability === undefined ? undefined : Number(probability),
      expectedCloseDate,
      actualCloseDate: req.body.actualCloseDate,
      description: req.body.description,
      owner: req.user.role === 'Sales Executive' ? req.user._id : (req.body.owner || req.user._id),
    };
    if (stage === 'Won') {
      payload.status = 'Closed';
      payload.actualCloseDate = new Date();
      payload.probability = 100;
    } else if (stage === 'Lost') {
      payload.status = 'Closed';
      payload.actualCloseDate = new Date();
      payload.probability = 0;
    }
    const opp = await Opportunity.create(payload);
    await writeAudit({ action: 'Create', entityName: 'Opportunity', recordId: opp._id, newValue: { name: opp.opportunityName, amount }, req });
    res.status(201).json({ success: true, data: opp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await Opportunity.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    if (req.user.role === 'Sales Executive' && String(existing.owner) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (req.body.amount !== undefined && Number(req.body.amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    if (req.body.probability !== undefined && (Number(req.body.probability) < 0 || Number(req.body.probability) > 100))
      return res.status(400).json({ success: false, message: 'Probability must be between 0 and 100.' });
    if (req.body.expectedCloseDate !== undefined && isBeforeToday(req.body.expectedCloseDate))
      return res.status(400).json({ success: false, message: 'Expected close date cannot be in the past.' });

    const payload = { ...req.body };
    if (req.user.role === 'Sales Executive') {
      delete payload.owner;
    }
    delete payload.actualCloseDate;
    if (payload.stage === 'Won') {
      payload.status = 'Closed';
      payload.probability = 100;
      if (!existing.actualCloseDate) {
        payload.actualCloseDate = new Date();
      }
    } else if (payload.stage === 'Lost') {
      payload.status = 'Closed';
      payload.probability = 0;
      if (!existing.actualCloseDate) {
        payload.actualCloseDate = new Date();
      }
    } else if (existing.stage === 'Won' || existing.stage === 'Lost') {
      return res.status(400).json({ success: false, message: 'A closed opportunity cannot be reopened by changing its stage.' });
    }
    const updated = await Opportunity.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate('customer', 'customerName');
    await writeAudit({ action: 'Update', entityName: 'Opportunity', recordId: existing._id, req });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    if (req.user.role === 'Sales Executive' && String(opp.owner) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    await opp.deleteOne();
    await writeAudit({ action: 'Delete', entityName: 'Opportunity', recordId: req.params.id, req });
    res.json({ success: true, message: 'Opportunity deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
