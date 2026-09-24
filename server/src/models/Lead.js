const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  scheduledAt: { type: Date, required: true },
  mode: { type: String, enum: ['Call', 'WhatsApp', 'Email', 'Meeting', 'SMS'], required: true },
  outcome: { type: String, default: '' },
  nextAction: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  notes: { type: String, default: '' }
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, trim: true },
  source: {
    type: String,
    enum: ['Website', 'Walk-in', 'Phone', 'WhatsApp', 'Fair', 'Campaign', 'Referral', 'Other'],
    required: true
  },
  course: { type: String, required: true, trim: true },
  qualification: String,
  preferredIntake: String,
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Counselling Scheduled', 'Application Started', 'Application Submitted', 'Converted', 'Not Interested', 'Lost', 'Deferred'],
    default: 'New'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  lastContactAt: Date,
  nextFollowUpAt: Date,
  convertedAt: Date,
  conversionValue: { type: Number, default: 0 },
  followUps: [followUpSchema]
}, { timestamps: true });

leadSchema.index({ name: 'text', email: 'text', phone: 'text', course: 'text' });
leadSchema.index({ status: 1, source: 1, counsellor: 1, createdAt: -1 });

leadSchema.virtual('ageingDays').get(function () {
  return Math.max(0, Math.floor((Date.now() - this.createdAt.getTime()) / 86400000));
});
leadSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lead', leadSchema);