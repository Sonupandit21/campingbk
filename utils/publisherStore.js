const Publisher = require('../models/Publisher');

// Get all publishers
async function getAllPublishers() {
  const publishers = await Publisher.find().sort({ publisherId: 1 });
  return publishers.map(p => ({
    ...p.toObject(),
    id: p.publisherId || p._id.toString() // Prefer sequential ID
  }));
}

// Create new publisher
async function createPublisher(publisherData) {
  // Auto-increment logic
  // Ignore legacy IDs (>= 10000) when finding the last used ID
  const lastPublisher = await Publisher.findOne({ publisherId: { $lt: 10000 } }).sort({ publisherId: -1 });
  const nextId = lastPublisher && lastPublisher.publisherId ? lastPublisher.publisherId + 1 : 1;

  // Auto-generate password if missing
  if (!publisherData.password) {
    publisherData.password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  }

  const publisher = new Publisher({
    ...publisherData,
    publisherId: nextId
  });
  
  await publisher.save();
  return {
    ...publisher.toObject(),
    id: publisher.publisherId
  };
}

// Update publisher
async function updatePublisher(id, publisherData) {
  let publisher;
  if (!mongoose.Types.ObjectId.isValid(id) && !isNaN(id)) {
     publisher = await Publisher.findOneAndUpdate({ publisherId: Number(id) }, publisherData, { new: true });
  } else {
     publisher = await Publisher.findByIdAndUpdate(id, publisherData, { new: true });
  }

  if (!publisher) {
    throw new Error('Publisher not found');
  }
  return {
    ...publisher.toObject(),
    id: publisher.publisherId || publisher._id.toString()
  };
}

// Delete publisher
async function deletePublisher(id) {
  if (!mongoose.Types.ObjectId.isValid(id) && !isNaN(id)) {
    await Publisher.findOneAndDelete({ publisherId: Number(id) });
  } else {
    await Publisher.findByIdAndDelete(id);
  }
  // Return updated list to match old contract
  return await getAllPublishers();
}

module.exports = {
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher
};
