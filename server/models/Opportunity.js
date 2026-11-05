const mongoose = require('mongoose');

/**
 * Opportunity model.
 * Business rules (enforced in controller):
 *  - amount must be > 0
 *  - probability must be 0–100
 *  - expectedCloseDate cannot be in the past (for new records)
 */
const opportunitySchema = new mongoose.Schema({
  opportunityName:  { type: String, required: true, trim: true, maxlength: 200 },
  customer:         { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  lead:             { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  amount:           { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
  stage: {
    type: String,
    enum: ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'Qualification'
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'OnHold'],
    default: 'Open'
  },
  probability:      { type: Number, default: 50, min: 0, max: 100 },
  expectedCloseDate:{ type: Date, required: true },
  actualCloseDate:  { type: Date },
  description:      { type: String, maxlength: 1000 },
  owner:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

opportunitySchema.index({ opportunityName: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
