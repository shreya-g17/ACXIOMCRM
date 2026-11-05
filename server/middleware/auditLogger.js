const AuditLog = require('../models/AuditLog');

/**
 * writeAudit — utility to write an audit log entry.
 * Silently swallows errors so audit failures never break request flow.
 */
const writeAudit = async ({ action, entityName, recordId, oldValue, newValue, description, req }) => {
  try {
    await AuditLog.create({
      action,
      entityName,
      recordId: recordId?.toString(),
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      description,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      user: req?.user?._id,
    });
  } catch (err) {
    // Never let audit failure break the request
    console.error('Audit write error:', err.message);
  }
};

module.exports = { writeAudit };
