const mongoose = require('mongoose');

/**
 * Lead model.
 * A lead can be converted to a Customer + Opportunity atomically.
 * convertedCustomer and convertedOpportunity are set on conversion.
 */
const leadSchema = new mongoose.Schema({
  leadCode:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  leadName:    { type: String, required: true, trim: true, maxlength: 150 },
  email:       { type: String, required: true, lowercase: true, trim: true, maxlength: 200 },
  phone:       { type: String, required: true, trim: true, maxlength: 20 },
  companyName: { type: String, trim: true, maxlength: 200 },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'SocialMedia', 'ColdCall', 'Email', 'Advertisement', 'Other'],
    default: 'Website'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
    default: 'New'
  },
  expectedValue:          { type: Number, default: 0, min: 0 },
  notes:                  { type: String, maxlength: 1000 },
  assignedTo:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  convertedCustomer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  convertedOpportunity:   { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  convertedAt:            { type: Date },
}, { timestamps: true });

leadSchema.index({ leadName: 'text', email: 'text', companyName: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
