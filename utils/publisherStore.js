const fs = require('fs').promises;
const path = require('path');

const PUBLISHERS_FILE = path.join(__dirname, '../data/publishers.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(PUBLISHERS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

// Read publishers from file
async function readPublishers() {
  try {
    const data = await fs.readFile(PUBLISHERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // File doesn't exist yet
    return [];
  }
}

async function getAllPublishers() {
  return await readPublishers();
}

// Write publishers to file
async function writePublishers(publishers) {
  await ensureDataDir();
  await fs.writeFile(PUBLISHERS_FILE, JSON.stringify(publishers, null, 2));
}

// Create new publisher
async function createPublisher(publisherData) {
  const publishers = await readPublishers();
  
  // Find max ID
  const maxId = publishers.reduce((max, p) => {
    const pId = parseInt(p.id);
    return !isNaN(pId) && pId > max ? pId : max;
  }, 0);

  const newId = (maxId + 1).toString();
  
  const newPublisher = {
    ...publisherData,
    id: newId,
    createdAt: new Date().toISOString()
  };
  
  publishers.push(newPublisher);
  await writePublishers(publishers);
  
  return newPublisher;
}

// Update publisher
async function updatePublisher(id, publisherData) {
  const publishers = await readPublishers();
  const index = publishers.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('Publisher not found');
  }

  const updatedPublisher = { ...publishers[index], ...publisherData };
  publishers[index] = updatedPublisher;
  await writePublishers(publishers);
  
  return updatedPublisher;
}

// Delete publisher
async function deletePublisher(id) {
  const publishers = await readPublishers();
  const newPublishers = publishers.filter(p => p.id !== id);
  await writePublishers(newPublishers);
  return newPublishers;
}

module.exports = {
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher
};
