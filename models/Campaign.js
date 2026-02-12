const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  campaignId: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  previewUrl: String,
  overrideUrl: String,
  defaultUrl: {
    type: String,
    required: true
  },
  defaultGoalName: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Stopped'],
    default: 'Active'
  },
  assignedPublishers: [{
    type: String // We use String IDs for now to maintain compatibility with existing frontend/logic
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for now to support legacy data without migration
  },
  sampling: [{
    publisherId: String,
    publisherName: String,
    samplingBasedOn: { type: String, default: 'Sub ID (Source)' },
    subIdsType: { type: String, enum: ['All', 'Exclude', 'Include'], default: 'All' },
    subIds: [String],
    samplingType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    samplingValue: Number,
    goalName: { type: String, default: 'Gross Conversions' }
  }],
  clicksSettings: [{
    publisherId: String,
    publisherName: String,
    basedOn: { type: String, default: 'Sub ID (Source)' },
    subIdsType: { type: String, enum: ['All', 'Exclude', 'Include'], default: 'All' },
    subIds: [String],
    type: { type: String, enum: ['Clicks', 'Unique Clicks', 'Both'], default: 'Clicks' },
    value: Number,
    action: { type: String, default: 'Cutoff' }
  }]
}, {
  timestamps: true
});

// Add a custom 'id' field if we want to maintain numeric/string IDs similar to file storage,
// or we can rely on _id. The frontend uses 'id'.
// Let's rely on mapping _id to id in the store adapter for now, or just use _id.
// However, the existing logic uses integer-like strings ("1", "2"). 
// To make migration easier, let's keep it simple for now and rely on _id.
// BUT: Existing frontend might expect `id`.
// Mongoose adds `id` virtual by default.

module.exports = mongoose.model('Campaign', campaignSchema);
