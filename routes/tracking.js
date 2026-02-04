const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Click = require('../models/Click');
const Conversion = require('../models/Conversion');
const { getPostbackConfig } = require('../utils/config');
const { getAllPublishers } = require('../utils/publisherStore');

// Helper to replace macros like {click_id}, {source} with actual values
function replaceMacros(url, params) {
  return url.replace(/{(.*?)}/g, (_, key) => params[key] || '');
}

// Dummy sendPostback (replace with real HTTP request)
async function sendPostback(url, label) {
  console.log(`[Postback] Sending to ${label}: ${url}`);
}

router.get('/', async (req, res) => {
  try {
    const {
      camp_id, publisher_id, click_id, payout,
      source, source_id, gaid, idfa, app_name, p1, p2
    } = req.query;

    if (!camp_id) return res.status(400).send('Missing camp_id');

    const finalSource = source || source_id || '';

    const params = {
      camp_id,
      publisher_id: publisher_id || '',
      click_id: click_id || '',
      payout: payout || '',
      source: finalSource,
      gaid: gaid || '',
      idfa: idfa || '',
      app_name: app_name || '',
      p1: p1 || '',
      p2: p2 || ''
    };

    // === Handle conversion postback ===
    if (payout) {
      console.log(`Conversion: camp=${camp_id}, click_id=${click_id}, payout=${payout}`);

      await Conversion.create({
        click_id,
        camp_id,
        publisher_id,
        payout: parseFloat(payout) || 0,
        source: finalSource,
        gaid,
        idfa,
        app_name,
        p1,
        p2,
        status: 'approved'
      });

      const config = await getPostbackConfig();
      if (config.url) sendPostback(replaceMacros(config.url, params), 'Global');

      if (publisher_id) {
        const publishers = await getAllPublishers();
        const publisher = publishers.find(p => p.id == publisher_id || p.referenceId == publisher_id);
        if (publisher?.postbackUrl) sendPostback(replaceMacros(publisher.postbackUrl, params), `Publisher ${publisher.id}`);
      }

      return res.json({ success: true, message: 'Conversion recorded' });
    }

    // === Handle clicks and redirects ===
    console.log(`Click: camp=${camp_id}, click_id=${click_id}`);

    // Log click async
    Click.create({
      click_id: click_id || '',
      camp_id,
      publisher_id: publisher_id || '',
      source: finalSource,
      payout: 0,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent') || ''
    }).catch(e => console.error('Click logging error:', e));

    // Fetch campaign
    let campaign;
    if (mongoose.Types.ObjectId.isValid(camp_id)) {
      campaign = await Campaign.findById(camp_id);
    }
    if (!campaign) {
      const allCampaigns = await Campaign.find({});
      campaign = allCampaigns.find(c => c._id.toString() === camp_id || c.id == camp_id);
    }
    if (!campaign) return res.status(404).send('Campaign not found');

    // Use overrideUrl if present, else defaultUrl
    const redirectUrl = campaign.overrideUrl || campaign.defaultUrl;
    if (!redirectUrl) return res.status(400).send('No redirect URL configured for campaign');

    const destinationUrl = replaceMacros(redirectUrl, params);
    console.log(`Redirecting to: ${destinationUrl}`);

    return res.redirect(destinationUrl);

  } catch (error) {
    console.error('Tracking error:', error);
    return res.status(500).json({ error: 'Tracking failed' });
  }
});

module.exports = router;




