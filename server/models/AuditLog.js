const mongoose = require('mongoose');

/**
 * AuditLog model — append-only.
 * Records every significant action (Login, Create, Update, Delete, etc.)
 * with user, IP address, entity, and old/new values.
 */
const auditLogSchema = new mongoose.Schema({
  action:     { type: String, required: true, maxlength: 100 },
  entityName: { type: String, maxlength: 100 },
  recordId:   { type: String },
  oldValue:   { type: String, maxlength: 4000 },
  newValue:   { type: String, maxlength: 4000 },
  description:{ type: String, maxlength: 500 },
  ipAddress:  { type: String, maxlength: 50 },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Prevent updates (append-only)
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog records are immutable.');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
