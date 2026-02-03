const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Conversion = require('../models/Conversion');
const mongoose = require('mongoose');

// Helper to replace macros
const replaceMacros = (url, params) => {
    if (!url) return '';
    return url
        .split('{click_id}').join(params.click_id || '')
        .split('{payout}').join(params.payout || '')
        .split('{camp_id}').join(params.camp_id || '')
        .split('{publisher_id}').join(params.publisher_id || '')
        .split('{source}').join(params.source || '')
        .split('{source_id}').join(params.source || '') // Alias
        .split('{gaid}').join(params.gaid || '')
        .split('{idfa}').join(params.idfa || '')
        .split('{app_name}').join(params.app_name || '')
        .split('{p1}').join(params.p1 || '')
        .split('{p2}').join(params.p2 || '');
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

// Tracking and Postback Endpoint
router.get('/', async (req, res) => {
  try {
    const { camp_id, publisher_id, click_id, payout, source, source_id, gaid, idfa, app_name, p1, p2 } = req.query;
    
    // Normalize source
    const finalSource = source || source_id || '';

    // ==========================================
    // SPECIAL OVERRIDE: Campaign 3 -> Unstop
    // ==========================================
    if (camp_id === '3') {
        const overrideUrl = "https://unstop.com/jobs/ai-marketing-manager-peppyduck-ventures-llp-1633086?utm_source=Affiliate&utm_medium=Affiliates&utm_campaign=trackier_1663&click_id=698222d649a610034d77d214&ref=Affbrandshapers2_{source}";
        // Note: The user request had ref=...%7Bsource%7D which decodes to {source}. 
        // Our replaceMacros function handles {source}.
        // The click_id in the URL provided by user is hardcoded "698222d649a610034d77d214".
        // Should we replace it with dynamic {click_id>? The user's text: "&click_id=698222d649a610034d77d214".
        // Use the user provided URL exactly, ensuring macros are replaced if present.
        // User text: `...&click_id=698222d649a610034d77d214&ref=Affbrandshapers2_%7Bsource%7D`
        // My replaceMacros helper handles {source}.
        
        let targetUrl = "https://unstop.com/jobs/ai-marketing-manager-peppyduck-ventures-llp-1633086?utm_source=Affiliate&utm_medium=Affiliates&utm_campaign=trackier_1663&click_id=698222d649a610034d77d214&ref=Affbrandshapers2_{source}";
        
        // If the user wants the DYNAMIC click_id to be passed, they should have used {click_id} in the target.
        // But the user pasted a specific link. 
        // "repace this url ... opne here this"
        // I will trust the user provided link.
        // Wait, "ref=Affbrandshapers2_%7Bsource%7D" -> {source}
        
        const params = {
            click_id: click_id || '',
            source: finalSource
        };
        const destinationUrl = replaceMacros(targetUrl, params);
        console.log(`[Override] Redirecting Campaign 3 to: ${destinationUrl}`);
        return res.redirect(destinationUrl);
    }

    // ==========================================
    // CASE 1: CONVERSION POSTBACK (Has Payout)
    // ==========================================
    if (payout) {
        console.log(`Received conversion: camp=${camp_id}, pub=${publisher_id}, click=${click_id}, source=${finalSource}, payout=${payout}`);

        const params = {
            click_id: click_id || '',
            payout: payout || '',
            camp_id: camp_id || '',
            publisher_id: publisher_id || '',
            source: finalSource,
            gaid: gaid || '',
            idfa: idfa || '',
            app_name: app_name || '',
            p1: p1 || '',
            p2: p2 || ''
        };

        // 1. Log conversion (Persist to DB)
        try {
            await Conversion.create({
                click_id: params.click_id,
                camp_id: params.camp_id,
                publisher_id: params.publisher_id,
                payout: parseFloat(params.payout) || 0,
                source: params.source,
                gaid: params.gaid,
                idfa: params.idfa,
                app_name: params.app_name,
                p1: params.p1,
                p2: params.p2,
                status: 'approved'
            });
            console.log('Conversion saved to DB');
        } catch (dbError) {
            console.error('Failed to save conversion to DB:', dbError);
        }

        // 2. Fire Global Postback if configured
        const config = await getPostbackConfig();
        if (config.url) {
          const postbackUrl = replaceMacros(config.url, params);
          sendPostback(postbackUrl, 'Global').catch(err => console.error('Global postback fatal error:', err));
        }

        // 3. Fire Publisher Specific Postback if configured
        if (publisher_id) {
            const { getAllPublishers } = require('../utils/publisherStore');
            const publishers = await getAllPublishers();
            
            // Loose matching for ID (string vs number)
            const publisher = publishers.find(p => p.id == publisher_id || p.referenceId == publisher_id);

            if (publisher && publisher.postbackUrl) {
                const pubPostbackUrl = replaceMacros(publisher.postbackUrl, params);
                sendPostback(pubPostbackUrl, `Publisher ${publisher.id}`).catch(err => console.error('Publisher postback fatal error:', err));
            }
        }

        return res.status(200).json({ success: true, message: 'Conversion recorded' });
    }

    // ==========================================
    // CASE 2: CLICK REDIRECTION (No Payout)
    // ==========================================
    else if (camp_id) {
        console.log(`Received click: camp=${camp_id}, pub=${publisher_id}, click_id=${click_id}`);

        // Log Click (Async)
        try {
            const Click = require('../models/Click');
            Click.create({
                click_id: click_id || '',
                camp_id: camp_id,
                publisher_id: publisher_id || '',
                source: finalSource,
                payout: 0,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent') || ''
            }).catch(e => console.error('Click logging background error:', e));
        } catch (e) {
            console.error('Click logging error:', e);
        }



        let campaign;
        try {
            // Attempt efficient lookup first
            if (mongoose.Types.ObjectId.isValid(camp_id)) {
                campaign = await Campaign.findById(camp_id);
            }
        } catch (err) {
            console.log('Direct ID lookup failed, trying fallback search');
        }

        // Fallback: If not found or invalid format, scan all to support legacy string/int IDs
        if (!campaign) {
            const allCampaigns = await Campaign.find({}); // Optimization: select only needed fields? .select('id defaultUrl')
            // Match _id or potential 'id' field loosely
            campaign = allCampaigns.find(c => c._id.toString() == camp_id || c.id == camp_id);
        }

        if (!campaign) {
            console.error(`Campaign not found for ID: ${camp_id}`);
            return res.status(404).send('Campaign not found');
        }

        if (!campaign.defaultUrl) {
            return res.status(400).send('Campaign has no destination URL');
        }

        // Prepare macros for replacement
        // Note: For clicks, we pass through whatever we received
        const params = {
            click_id: click_id || '',
            payout: '', // No payout on click
            camp_id: camp_id,
            publisher_id: publisher_id || '',
            source: finalSource,
            gaid: gaid || '',
            idfa: idfa || '',
            app_name: app_name || '',
            p1: p1 || '',
            p2: p2 || ''
        };

        const destinationUrl = replaceMacros(campaign.defaultUrl, params);
        
        console.log(`Redirecting to: ${destinationUrl}`);
        return res.redirect(destinationUrl);
    }
    
    // ==========================================
    // CASE 3: INVALID REQUEST
    // ==========================================
    else {
        return res.status(400).send('Missing required parameters (camp_id)');
    }

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

module.exports = router;
