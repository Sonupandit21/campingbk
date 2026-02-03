const PostbackConfig = require('../models/PostbackConfig');

// Read postback config (Singleton behavior)
async function getPostbackConfig() {
  try {
    const config = await PostbackConfig.findOne();
    if (!config) {
      return { url: '' };
    }
    return { ...config.toObject(), id: config._id.toString() };
  } catch (err) {
    console.error('Error fetching postback config:', err);
    return { url: '' };
  }
}

// Save postback config (Upsert)
async function savePostbackConfig(configData) {
  try {
    // Update existing or create new if not exists
    // Since there should be only one, we can find one or create.
    let config = await PostbackConfig.findOne();
    
    if (config) {
        config.url = configData.url;
        await config.save();
    } else {
        config = new PostbackConfig(configData);
        await config.save();
    }
    
    return { ...config.toObject(), id: config._id.toString() };
  } catch (err) {
    console.error('Error saving postback config:', err);
    throw err;
  }
}

module.exports = {
  getPostbackConfig,
  savePostbackConfig
};
