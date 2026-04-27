const mongoose = require('mongoose');

const postbackConfigSchema = new mongoose.Schema({
  url: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PostbackConfig', postbackConfigSchema);
