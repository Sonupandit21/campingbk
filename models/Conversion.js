const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  click_id: String,
  camp_id: {
    type: String, // Storing as String to match simplified Campaign ID usage
    required: true,
    index: true
  },
  publisher_id: {
    type: String,
    index: true
  },
  payout: Number,
  source: String,
  gaid: String,
  idfa: String,
  app_name: String,
  p1: String,
  p2: String,
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'sampled'],
    default: 'approved' // Auto-approve postbacks for now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversion', conversionSchema);
