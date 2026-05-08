const mongoose = require('mongoose');

const postbackSchema = new mongoose.Schema({
  postbackId: {
    type: Number,
    unique: true
  },
  publisher: {
    type: String, // Storing publisherId (e.g. "1") for compatibility
    required: true
  },
  campaign: {
    type: String, // Storing campaignId or "ALL"
    required: true
  },
  type: {
    type: String,
    enum: ['Postback URL', 'Image Pixel', 'JS Pixel'],
    required: true
  },
  event: {
    type: String,
    enum: ['CONVERSION', 'GOAL', 'CONVERSION + ALL GOALs'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  data: {
    type: String,
    required: true
  },
  privacyPostbackUrl: {
    type: String,
    default: ''
  },
  allowedConversionStatus: {
    type: [String],
    default: ['Approved']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Postback', postbackSchema);
