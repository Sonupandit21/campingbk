const Publisher = require('../models/Publisher');

// Get all publishers
async function getAllPublishers() {
  const publishers = await Publisher.find().sort({ createdAt: -1 });
  return publishers.map(p => ({
    ...p.toObject(),
    id: p._id.toString()
  }));
}

// Create new publisher
async function createPublisher(publisherData) {
  const publisher = new Publisher(publisherData);
  await publisher.save();
  return {
    ...publisher.toObject(),
    id: publisher._id.toString()
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
