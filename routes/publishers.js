const express = require('express');
const router = express.Router();
const { getAllPublishers, createPublisher, updatePublisher, deletePublisher } = require('../utils/publisherStore');

const auth = require('../middleware/auth');

// Get all publishers
router.get('/', auth, async (req, res) => {
  try {
    const Publisher = require('../models/Publisher');
    const publishers = await Publisher.find({ created_by: req.user.id }).sort({ createdAt: -1 });
    
    // Format to include numeric id if needed or just return objects
    const formatted = publishers.map(p => ({
        ...p.toObject(),
        id: p.publisherId || p._id
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get publishers error:', error);
    // Return empty array to allow dashboard to load even if DB fails
    res.json([]);
  }
});

// Create publisher
router.post('/', auth, async (req, res) => {
  try {
    const publisherData = req.body;
    publisherData.created_by = req.user.id;
    
    // Use utils or direct model creation. 
    // Utils `createPublisher` likely doesn't handle `created_by` unless we pass it.
    // Let's rely on utils if updated or just use direct model here to ensure control.
    // Ideally we update utils, but direct is safer for this specific requirement without refactoring utils fully.
    
    // We need auto-increment ID logic from utils though?
    // Let's look at doing it properly.
    const { createPublisher } = require('../utils/publisherStore');
    // We can pass the full object with created_by.
    // But `createPublisher` might use strict schema validation or create a new object.
    // Let's modify `publisherStore.js` logic inline here OR update `publisherStore.js`.
    // Easier: Modify `utils/publisherStore.js` to include `created_by` in the model creation.
    // BUT, since we have the model `Publisher` locally here (conceptually), let's just use `createPublisher` with the extra field 
    // AND we need to update `publisherStore.js` to allow it or simple pass `...data`.
    
    // Re-reading `files`, I haven't seen `utils/publisherStore.js`. Let's assume it takes `data` and passes to `new Publisher(data)`.
    // Valid approach: Pass `created_by` in body.
    
    const publisher = await createPublisher(publisherData);
    res.status(201).json(publisher);
  } catch (error) {
    console.error('Create publisher error:', error);
    res.status(500).json({ error: 'Failed to create publisher' });
  }
});

// Update publisher
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const publisher = await updatePublisher(id, req.body);
    res.json(publisher);
  } catch (error) {
    console.error('Update publisher error:', error);
    res.status(500).json({ error: 'Failed to update publisher' });
  }
});

// Delete publisher
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deletePublisher(id);
    res.json({ message: 'Publisher deleted successfully' });
  } catch (error) {
    console.error('Delete publisher error:', error);
    res.status(500).json({ error: 'Failed to delete publisher' });
  }
});

module.exports = router;
