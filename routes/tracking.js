const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Click = require('../models/Click');
const Conversion = require('../models/Conversion');
const { getPostbackConfig } = require('../utils/postbackStore');
const { getAllPublishers } = require('../utils/publisherStore');
const { fireTrackierPostback } = require('../utils/trackier');

// Helper to replace macros like {click_id}, {source} with actual values
const replaceMacros = (url, params) => {
    if (!url) return '';
    console.log(`[MacroReplace] Input: ${url} | ClickID: ${params.click_id}`);
    
    let processedUrl = url;

    // Map of keys to values
    const replacements = {
        '{click_id}': params.click_id || '',
        '{payout}': params.payout || '',
        '{camp_id}': params.camp_id || '',
        '{publisher_id}': params.publisher_id || '',
        '{source}': params.source || '',
        '{source_id}': params.source || '',
        '{gaid}': params.gaid || '',
        '{idfa}': params.idfa || '',
        '{app_name}': params.app_name || '',
        '{p1}': params.p1 || '',
        '{p2}': params.p2 || ''
    };

    // Replace both standard and URL-encoded versions
    for (const [key, value] of Object.entries(replacements)) {
        // Standard {key}
        processedUrl = processedUrl.split(key).join(value);
        
        // Encoded %7Bkey%7D (case insensitive usually not needed for hex, but key content might be)
        const encodedKey = key.replace('{', '%7B').replace('}', '%7D');
        processedUrl = processedUrl.split(encodedKey).join(value);
    }

    console.log(`[MacroReplace] Output: ${processedUrl}`);
    return processedUrl;
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

// Start Sampling Logic
const checkIsSampled = (campaign, publisher, source) => {
    if (!campaign || !campaign.sampling || campaign.sampling.length === 0) return false;

    // Normalize inputs
    const sourceStr = String(source || '');

    for (const rule of campaign.sampling) {
        // 1. Check Publisher Match
        if (rule.publisherId) {
            // Rule has a specific publisher.
            // Check against passed publisher object (if available) or raw ID
            let match = false;
            const rulePubIdStr = String(rule.publisherId);
            
            if (publisher) {
                // Check against both .id (legacy) and ._id (mongo) and .referenceId
                if (String(publisher.id) === rulePubIdStr) match = true;
                if (String(publisher._id) === rulePubIdStr) match = true;
                if (publisher.referenceId && String(publisher.referenceId) === rulePubIdStr) match = true;
            } 
            
            // Also check raw publisher_id passed in case lookup failed but IDs match exactly
            if (!match && publisher && String(publisher.id) === rulePubIdStr) match = true; // Redundant but safe
            
            if (!match) continue; // Publisher mismatch
        }

        // 2. Check Sub ID (Source) Match
        let subIdMatch = false;
        const ruleSubIds = (rule.subIds || []).map(s => String(s).trim());

        if (rule.subIdsType === 'All') {
            subIdMatch = true;
        } else if (rule.subIdsType === 'Include') {
            // Apply ONLY if source is in the list
            if (ruleSubIds.includes(sourceStr)) subIdMatch = true;
        } else if (rule.subIdsType === 'Exclude') {
            // Apply ONLY if source is NOT in the list
            if (!ruleSubIds.includes(sourceStr)) subIdMatch = true;
        }

        if (!subIdMatch) continue;

        // 3. Goal Name Match? 
        // Currently we don't receive 'goal' in conversion param usually, unless passed. 
        // For now, assuming rules apply generally to the campaign conversion.
        // If we want to support multi-goal sampling, we'd need goal_name in parameters.

        // 4. Apply Sampling Probability
        // samplingValue is percentage to CUT (Sample). e.g. 20 means 20% are sampled.
        const threshold = parseFloat(rule.samplingValue) || 0;
        const randomVal = Math.random() * 100;

        if (randomVal < threshold) {
            console.log(`[Sampling] HIT: Rule matched (PubRule: ${rule.publisherId}, Type: ${rule.subIdsType}, Val: ${threshold}%)`);
            return true; // Is Sampled
        } else {
            console.log(`[Sampling] MISS: Rule matched but RNG passed (Val: ${randomVal.toFixed(2)} >= ${threshold})`);
            // If rule matched but RNG didn't hit, do we stop? 
            // Usually, if a rule applies, we process it. If we didn't sample, we don't look for other rules for the same pub?
            // Let's assume one rule per publisher for now.
            return false;
        }
    }

    return false; // No rules matched or triggered
};
// End Sampling Logic

// ==========================================
// HANDLE CONVERSION (Inbound Postback)
// ==========================================
const handleConversion = async (req, res) => {
    try {
        const { click_id, payout, camp_id: queryCampId } = req.query;

        // 1. Validation
        if (!click_id) {
            return res.status(400).json({ error: 'Missing click_id' });
        }

        console.log(`[Conversion] Received for click_id: ${click_id}, payout: ${payout}, camp_id: ${queryCampId || 'N/A'}`);

        // 2. Validate Click Exists in DB
        const click = await Click.findOne({ click_id });
        if (!click) {
            console.error(`[Conversion] Click not found for ID: ${click_id}`);
            return res.status(404).json({ error: 'Invalid click_id' });
        }

        // 3. Prevent Duplicates
        // Using findOne is simple. For high concurrency, checking existing might have race conditions 
        // without a unique index, but good enough for now.
        const existingConv = await Conversion.findOne({ click_id });
        if (existingConv) {
            console.warn(`[Conversion] Duplicate conversion for click_id: ${click_id}`);
            // Return 200 to indicate we processed it (idempotency), or 409 conflict.
            // Advertisers often retry postbacks, so 200 is safer to stop retries.
            return res.status(200).json({ message: 'Conversion already recorded' });
        }

        // 4. Resolve Details from Click
        const { camp_id, publisher_id, source, gaid, idfa, app_name, p1, p2 } = click;
        const validPayout = parseFloat(payout) || 0;

        // 5. Save Conversion
        const newConversion = await Conversion.create({
            click_id,
            camp_id,
            publisher_id,
            payout: validPayout,
            source,
            gaid,
            idfa,
            app_name,
            p1,
            p2,
            status: 'approved' // Default
        });

        // 5b. Fetch Campaign for Sampling Check
        let campaign = null;
        try {
             campaign = await Campaign.findOne({ campaignId: camp_id }); // camp_id is Number usually
             if(!campaign) campaign = await Campaign.findById(camp_id);  // Try by _id if number lookup fails
        } catch(e) { console.error('Error fetching campaign for sampling:', e); }

        // 5c. Check Sampling
        let isSampled = false;
        if (campaign) {
            // Fetch Publisher for Robust Matching
            let publisherObj = null;
            if (publisher_id) {
                try {
                    const allPublishers = await getAllPublishers();
                    publisherObj = allPublishers.find(p => p.id == publisher_id || p.referenceId == publisher_id || p._id == publisher_id);
                } catch(e) { console.error('Error fetching publisher for sampling:', e); }
            }
            
            isSampled = checkIsSampled(campaign, publisherObj, source);
        }

        if (isSampled) {
             console.log('[Conversion] Marked as SAMPLED');
             newConversion.status = 'sampled';
             await newConversion.save();
        } else {
            console.log('[Conversion] Marked as APPROVED');
             // Already 'approved' by default
        }
        
        console.log('[Conversion] Saved to DB');

        // 6. Fire Trackier S2S Postback (ALWAYS FIRE to track revenue)
        // Background async fire
        fireTrackierPostback(click_id, validPayout).catch(err => console.error('[Trackier] Error firing postback:', err));

        // 7. Fire Legacy Postbacks (ONLY IF NOT SAMPLED)
        if (!isSampled) {
            // Construct params for macro replacement
            const params = {
                click_id,
                payout: validPayout,
                camp_id,
                publisher_id,
                source,
                gaid,
                idfa,
                app_name,
                p1,
                p2
            };

            // Global Postback
            getPostbackConfig().then(config => {
                if (config.url) {
                    const postbackUrl = replaceMacros(config.url, params);
                    sendPostback(postbackUrl, 'Global').catch(err => console.error('Global postback fatal error:', err));
                }
            });

            // Publisher Postback
            if (publisher_id) {
                getAllPublishers().then(publishers => {
                    // Loose matching for ID
                    const publisher = publishers.find(p => p.id == publisher_id || p.referenceId == publisher_id);
                    if (publisher && publisher.postbackUrl) {
                        const pubPostbackUrl = replaceMacros(publisher.postbackUrl, params);
                        sendPostback(pubPostbackUrl, `Publisher ${publisher.id}`).catch(err => console.error('Publisher postback fatal error:', err));
                    }
                });
            }
        } else {
            console.log('[Postback] Skipped Global/Publisher postbacks due to SAMPLING');
        }

        return res.status(200).json({ success: true, message: isSampled ? 'Conversion recorded (sampled)' : 'Conversion recorded successfully' });

    } catch (error) {
        console.error('[Conversion] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==========================================
// HANDLE CLICK (Tracking & Redirect)
// ==========================================
const handleTracking = async (req, res) => {
  try {
    const { camp_id, publisher_id, click_id, source, source_id, gaid, idfa, app_name, p1, p2 } = req.query;
    
    // Auto-generate click_id if missing or placeholder (essential for tracking)
    // Regex matches any '{', '}', or '%' characters, effectively catching {click_id}, %7Bclick_id%7D, etc.
    const isInvalidId = !click_id || /[\{\}\%]/.test(click_id);
    const finalClickId = isInvalidId ? new mongoose.Types.ObjectId().toString() : click_id;

    // Normalize source
    const finalSource = source || source_id || '';

    // ==========================================
    // CASE 2: CLICK REDIRECTION (No Payout)
    // ==========================================
    if (camp_id) {
        // USE FINALCLICKID HERE
        console.log(`Received click: camp=${camp_id}, pub=${publisher_id}, click_id=${finalClickId}`);

        // Log Click (Async) with FINALCLICKID
        try {
            Click.create({
                click_id: finalClickId,
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
            const allCampaigns = await Campaign.find({}); // Optimization: select only needed fields? .select('id defaultUrl overrideUrl')
            // Match _id or potential 'id' field loosely
            campaign = allCampaigns.find(c => c._id.toString() == camp_id || c.campaignId == camp_id || c.id == camp_id);
        }

        if (!campaign) {
            console.error(`Campaign not found for ID: ${camp_id}`);
            return res.status(404).send('Campaign not found');
        }

        // === DETERMINING TARGET URL (With Fallback) ===
        // Prioritize overrideUrl if set, otherwise defaultUrl
        const targetUrl = campaign.overrideUrl || campaign.defaultUrl;

        if (!targetUrl) {
            return res.status(400).send('Campaign has no destination URL');
        }

        // Prepare macros for replacement
        // Note: For clicks, we pass through whatever we received OR generated
        const params = {
            click_id: finalClickId,  // <--- CRITICAL FIX: Use generated ID
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

        const destinationUrl = replaceMacros(targetUrl, params);
        
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
};

// Tracking and Postback Endpoints
router.get('/', handleTracking);
router.get('/conversion', handleConversion); // Dedicated conversion endpoint

module.exports = router;
