const fs = require('fs').promises;
const path = require('path');

const POSTBACK_FILE = path.join(__dirname, '../data/postback.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(POSTBACK_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

// Read postback config
async function getPostbackConfig() {
  try {
    const data = await fs.readFile(POSTBACK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { url: '' };
  }
}

// Save postback config
async function savePostbackConfig(config) {
  await ensureDataDir();
  await fs.writeFile(POSTBACK_FILE, JSON.stringify(config, null, 2));
  return config;
}

module.exports = {
  getPostbackConfig,
  savePostbackConfig
};
