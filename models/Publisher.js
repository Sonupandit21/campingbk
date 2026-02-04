const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema({
  publisherId: {
    type: Number,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  password: {
    type: String,
    required: true
  },
  postbackUrl: String,
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Publisher', publisherSchema);
