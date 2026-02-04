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
  const lastPublisher = await Publisher.findOne().sort({ publisherId: -1 });
  const nextId = lastPublisher && lastPublisher.publisherId ? lastPublisher.publisherId + 1 : 1;

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
  const publisher = await Publisher.findByIdAndUpdate(id, publisherData, { new: true });
  if (!publisher) {
    throw new Error('Publisher not found');
  }
  return {
    ...publisher.toObject(),
    id: publisher._id.toString()
  };
}

// Delete publisher
async function deletePublisher(id) {
  await Publisher.findByIdAndDelete(id);
  // Return updated list to match old contract
  return await getAllPublishers();
}

module.exports = {
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher
};
