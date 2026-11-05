const Customer = require('../models/Customer');
const { writeAudit } = require('../middleware/auditLogger');
const { textFilter } = require('../utils/search');

const owns = (req, ownerId) =>
  req.user.role !== 'Sales Executive' || String(ownerId) === String(req.user._id);

// ── GET /api/customers ─────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Sales Executives see only their own customers
    if (req.user.role === 'Sales Executive') filter.owner = req.user._id;
    if (status) filter.status = status;
    const text = textFilter(search, ['customerName', 'email', 'phone', 'companyName', 'customerCode']);
    if (text) Object.assign(filter, text);

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * pageSize;
    const [customers, total] = await Promise.all([
      Customer.find(filter).populate('owner', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Customer.countDocuments(filter),
    ]);

    res.json({ success: true, data: customers, total, page: currentPage, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/customers/:id ─────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('owner', 'fullName email');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    if (!owns(req, customer.owner?._id || customer.owner))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/customers ────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { customerName, email, phone, companyName, address, city, state, status, ownerId } = req.body;

    // Uniqueness checks
    if (await Customer.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ success: false, message: 'A customer with this email already exists.' });
    if (await Customer.findOne({ phone }))
      return res.status(409).json({ success: false, message: 'A customer with this phone already exists.' });

    // Auto-generate customer code
    const count = await Customer.countDocuments();
    const customerCode = `CUS-${String(count + 1).padStart(3, '0')}`;

    const customer = await Customer.create({
      customerCode, customerName, email, phone, companyName, address, city, state,
      status: status || 'Active',
      owner: (req.user.role === 'Sales Executive' ? req.user._id : (ownerId || req.user._id)),
    });

    await writeAudit({ action: 'Create', entityName: 'Customer', recordId: customer._id, newValue: { customerName, email }, req });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Email or phone already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/customers/:id ─────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const existing = await Customer.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Customer not found.' });

    if (!owns(req, existing.owner))
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const { customerName, email, phone, companyName, address, city, state, status, ownerId } = req.body;
    if (email && email.toLowerCase() !== existing.email && await Customer.findOne({ email: email.toLowerCase(), _id: { $ne: existing._id } }))
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    if (phone && phone !== existing.phone && await Customer.findOne({ phone, _id: { $ne: existing._id } }))
      return res.status(409).json({ success: false, message: 'Phone number already in use.' });

    const payload = { customerName, email, phone, companyName, address, city, state, status };
    if (ownerId && req.user.role !== 'Sales Executive') payload.owner = ownerId;

    const oldValue = { customerName: existing.customerName, email: existing.email };
    const updated = await Customer.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate('owner', 'fullName');

    await writeAudit({ action: 'Update', entityName: 'Customer', recordId: existing._id, oldValue, newValue: { customerName: updated.customerName, email: updated.email }, req });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/customers/:id ──────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    if (!owns(req, customer.owner))
      return res.status(403).json({ success: false, message: 'Access denied.' });

    await Customer.findByIdAndDelete(req.params.id);
    await writeAudit({ action: 'Delete', entityName: 'Customer', recordId: req.params.id, oldValue: { customerName: customer.customerName }, req });
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
