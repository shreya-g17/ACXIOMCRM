const mongoose = require('mongoose');

/**
 * FollowUp model.
 * Business rule: followUpDate cannot be in the past for new Planned follow-ups.
 * Linked to either a Customer or a Lead (or both).
 */
const followUpSchema = new mongoose.Schema({
  subject:      { type: String, required: true, trim: true, maxlength: 200 },
  followUpDate: { type: Date, required: true },
  followUpType: {
    type: String,
    enum: ['Call', 'Meeting', 'Email', 'Task'],
    default: 'Call'
  },
  status: {
    type: String,
    enum: ['Planned', 'Completed', 'Missed', 'Cancelled'],
    default: 'Planned'
  },
  notes:        { type: String, maxlength: 2000 },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  lead:         { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', followUpSchema);
