const express = require('express');
const router = express.Router();
const { getAllPublishers, createPublisher, updatePublisher, deletePublisher } = require('../utils/publisherStore');

// Get all publishers
router.get('/', async (req, res) => {
  try {
    const publishers = await getAllPublishers();
    res.json(publishers);
  } catch (error) {
    console.error('Get publishers error:', error);
    res.status(500).json({ error: 'Failed to fetch publishers', details: error.message });
  }
});

// Create publisher
router.post('/', async (req, res) => {
  try {
    const publisher = await createPublisher(req.body);
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
