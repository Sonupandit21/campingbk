const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  click_id: String,
  camp_id: String, // Can be ObjectId string or custom ID
  publisher_id: String,
  source: String,
  payout: Number,
  ip_address: String,
  user_agent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Click', clickSchema);
