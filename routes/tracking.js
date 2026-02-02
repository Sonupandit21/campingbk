const express = require('express');
const router = express.Router();
const { getPostbackConfig } = require('../utils/postbackStore');

// Helper to replace macros
const replaceMacros = (url, params) => {
    return url
        .replace('{click_id}', params.click_id || '')
        .replace('{payout}', params.payout || '')
        .replace('{camp_id}', params.camp_id || '')
        .replace('{publisher_id}', params.publisher_id || '')
        .replace('{source}', params.source || '');
};

// Helper to send postback with retry logic
const sendPostback = async (url, type) => {
    const maxRetries = 3;
    const timeout = 15000; // 15 seconds

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Firing ${type} postback (Attempt ${i + 1}/${maxRetries}): ${url}`);
            
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);

            if (response.ok) {
                console.log(`${type} postback successful.`);
                return;
            } else {
                console.warn(`${type} postback returned status: ${response.status}`);
            }
        } catch (error) {
            console.error(`${type} postback attempt ${i + 1} failed:`, error.message);
            if (i < maxRetries - 1) {
                // Wait before retrying (1s, 2s, ...)
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    console.error(`${type} postback failed after ${maxRetries} attempts.`);
};

// Inbound conversion tracking endpoint
router.get('/', async (req, res) => {
  try {
    const { camp_id, publisher_id, click_id, payout, source, source_id } = req.query;
    // Use source_id if source is not present
    const finalSource = source || source_id;
    
    console.log(`Received conversion: camp=${camp_id}, pub=${publisher_id}, click=${click_id}, source=${finalSource}, payout=${payout}`);

    const params = {
        click_id,
        payout,
        camp_id,
        publisher_id,
        source: finalSource
    };

    // 1. Log or store the conversion locally (TODO: Implement conversion storage)

    // 2. Fire Global Postback if configured
    const config = await getPostbackConfig();
    if (config.url) {
      const postbackUrl = replaceMacros(config.url, params);
      // Fire asynchronously, don't await response for the tracking request
      sendPostback(postbackUrl, 'Global').catch(err => console.error('Global postback fatal error:', err));
    }

    // 3. Fire Publisher Specific Postback if configured
    if (publisher_id) {
        const { getAllPublishers } = require('../utils/publisherStore');
        const publishers = await getAllPublishers();
        
        const publisher = publishers.find(p => p.id === publisher_id || p.referenceId === publisher_id);

        if (publisher && publisher.postbackUrl) {
            const pubPostbackUrl = replaceMacros(publisher.postbackUrl, params);
            sendPostback(pubPostbackUrl, `Publisher ${publisher.id}`).catch(err => console.error('Publisher postback fatal error:', err));
        }
    }

    res.status(200).json({ success: true, message: 'Conversion recorded' });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

module.exports = router;
