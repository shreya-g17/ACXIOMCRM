const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User model — stores credentials, role, and profile.
 * Passwords are hashed with bcrypt (salt rounds = 12) via pre-save hook.
 * Account lockout tracked with failedLoginAttempts + lockUntil.
 */
const userSchema = new mongoose.Schema({
  fullName:    { type: String, required: true, trim: true, maxlength: 150 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  role:        { type: String, enum: ['Admin', 'Manager', 'Sales Executive'], default: 'Sales Executive' },
  department:  { type: String, maxlength: 100 },
  isActive:    { type: Boolean, default: true },

  // Lockout tracking
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil:           { type: Date },
}, { timestamps: true });

// ── Pre-save: hash password ─────────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare password ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: isLockedOut ────────────────────────────────────────────────────
userSchema.virtual('isLockedOut').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Never return password in JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
