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
// Start Sampling Logic
const checkIsSampled = async (campaign, publisher, source, rawPublisherId, goalName = '') => {
    if (!campaign || !campaign.sampling || campaign.sampling.length === 0) return false;

    // Normalize inputs
    const sourceStr = String(source || '');
    const rawPubIdStr = String(rawPublisherId || '');
    const targetGoalName = String(goalName || '').toLowerCase().trim();

    // Get start of today for fixed counting
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const rule of campaign.sampling) {
        // 1. Check Publisher Match
        if (rule.publisherId) {
            // Rule has a specific publisher.
            let match = false;
            const rulePubIdStr = String(rule.publisherId);
            
            console.log(`[Sampling] Checking Rule PubID: ${rulePubIdStr} vs Conversion Pub Object ID: ${publisher ? publisher.id : 'N/A'}, Raw ID: ${rawPubIdStr}`);

            // A. Check Object Properties (if publisher found)
            if (publisher) {
                try {
                    // Check against both .id (legacy) and ._id (mongo) and .referenceId
                    if (publisher.id && String(publisher.id) === rulePubIdStr) match = true;
                    if (publisher._id && publisher._id.toString() === rulePubIdStr) match = true;
                    if (publisher.referenceId && String(publisher.referenceId) === rulePubIdStr) match = true;
                } catch (err) {
                    console.error('[Sampling] Error comparing publisher IDs:', err);
                }
            } 
            
            // B. Check Raw ID (Fallback or if Object lookup failed)
            if (!match && rawPubIdStr === rulePubIdStr) {
                 match = true;
                 console.log('[Sampling] Matched via Raw Publisher ID');
            }
            
            if (!match) {
                continue; // Publisher mismatch
            }
        }

        // 2. Check Sub ID (Source) Match
        let subIdMatch = false;
        const ruleSubIds = (rule.subIds || []).map(s => String(s).trim());

        if (rule.subIdsType === 'All') {
            subIdMatch = true;
        } else if (rule.subIdsType === 'Include') {
            if (ruleSubIds.includes(sourceStr)) subIdMatch = true;
        } else if (rule.subIdsType === 'Exclude') {
            if (!ruleSubIds.includes(sourceStr)) subIdMatch = true;
        }

        if (!subIdMatch) continue;

        // 3. Check Goal Name Match
        const ruleGoalName = String(rule.goalName || 'Gross Conversions').toLowerCase().trim();
        const isGlobalGoal = ruleGoalName === 'gross conversions' || ruleGoalName === '';
        
        if (!isGlobalGoal && ruleGoalName !== targetGoalName) {
            console.log(`[Sampling] Goal Mismatch: Rule='${ruleGoalName}', Conversion='${targetGoalName}'`);
            continue;
        }

        // 4. Apply Sampling Logic (Fixed vs Percentage)
        const samplingType = String(rule.samplingType || 'percentage').toLowerCase();
        const threshold = parseFloat(rule.samplingValue) || 0;

        if (samplingType === 'fixed') {
             // Fixed: Sample (Deduct) specific NUMBER of conversions daily
             
             try {
                 const query = {
                     camp_id: campaign.campaignId, 
                     originalStatus: 'sampled',
                     createdAt: { $gte: startOfDay }
                 };
                 
                 if (rule.publisherId) {
                     query.publisher_id = rawPubIdStr; 
                 }
                 
                 if (!isGlobalGoal) {
                     query.goal_name = rule.goalName; 
                 }

                 const currentSampledCount = await Conversion.countDocuments(query);
                 console.log(`[Sampling] Fixed Check: Limit=${threshold}, Current=${currentSampledCount}`);

                 if (currentSampledCount < threshold) {
                     console.log(`[Sampling] HIT: Fixed limit not reached. Sampling this conversion.`);
                     return true;
                 } else {
                     console.log(`[Sampling] MISS: Fixed limit reached. Passing conversion.`);
                     return false;
                 }
             } catch (err) {
                 console.error('[Sampling] Error counting documents for fixed sampling:', err);
                 return false;
             }

        } else {
            // Percentage (Default)
            const randomVal = Math.random() * 100;
            if (randomVal < threshold) {
                console.log(`[Sampling] HIT: Rule matched (PubRule: ${rule.publisherId}, Goal: ${rule.goalName}, Val: ${threshold}%)`);
                return true; 
            } else {
                console.log(`[Sampling] MISS: Rule matched but RNG passed (Val: ${randomVal.toFixed(2)} >= ${threshold})`);
                return false;
            }
        }
    }

    return false; // No rules matched or triggered
};
// End Sampling Logic

// Start Clicks Cutoff Logic
const checkClicksCutoff = async (campaign, publisher, source, rawPublisherId) => {
    if (!campaign || !campaign.clicksSettings || campaign.clicksSettings.length === 0) return false;

    // Normalize inputs
    const sourceStr = String(source || '');
    const rawPubIdStr = String(rawPublisherId || '');

    // Get start of today for counting
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const rule of campaign.clicksSettings) {
        // 1. Check Publisher Match
        if (rule.publisherId) {
            let match = false;
            const rulePubIdStr = String(rule.publisherId);
            
            console.log(`[ClicksCutoff] Checking Rule PubID: ${rulePubIdStr} vs Publisher ID: ${rawPubIdStr}`);

            // Check against publisher object if available
            if (publisher) {
                try {
                    if (publisher.id && String(publisher.id) === rulePubIdStr) match = true;
                    if (publisher._id && publisher._id.toString() === rulePubIdStr) match = true;
                    if (publisher.referenceId && String(publisher.referenceId) === rulePubIdStr) match = true;
                } catch (err) {
                    console.error('[ClicksCutoff] Error comparing publisher IDs:', err);
                }
            }
            
            // Check raw ID fallback
            if (!match && rawPubIdStr === rulePubIdStr) {
                match = true;
                console.log('[ClicksCutoff] Matched via Raw Publisher ID');
            }
            
            if (!match) {
                continue; // Publisher mismatch
            }
        }

        // 2. Check Sub ID (Source) Match
        let subIdMatch = false;
        const ruleSubIds = (rule.subIds || []).map(s => String(s).trim());

        if (rule.subIdsType === 'All') {
            subIdMatch = true;
        } else if (rule.subIdsType === 'Include') {
            if (ruleSubIds.includes(sourceStr)) subIdMatch = true;
        } else if (rule.subIdsType === 'Exclude') {
            if (!ruleSubIds.includes(sourceStr)) subIdMatch = true;
        }

        if (!subIdMatch) continue;

        // 3. Apply Clicks Cutoff Logic
        const cutoffValue = parseFloat(rule.value) || 0;
        const cutoffTypeMode = rule.cutoffType || 'percentage'; // 'percentage' or 'count'
        const clickType = rule.type || 'Clicks'; // 'Clicks', 'Unique Clicks', 'Both'

        try {
            const query = {
                camp_id: String(campaign.campaignId),
                timestamp: { $gte: startOfDay } // FIX: Use 'timestamp' instead of 'createdAt' for clicks
            };
            
            if (rule.publisherId) {
                query.publisher_id = rawPubIdStr;
            }

            // Apply Clicks Cutoff Logic
            if (cutoffTypeMode === 'percentage') {
                // Probabilistic Sampling: Each click has a X% chance of being sampled
                const randomVal = Math.random() * 100;
                if (randomVal < cutoffValue) {
                    console.log(`[ClicksCutoff] HIT: Percentage Rule (Val: ${cutoffValue}%, RNG: ${randomVal.toFixed(2)})`);
                    return true;
                }
            } else {
                // Fixed Count Logic: Sample all clicks AFTER the Nth click
                if (clickType === 'Clicks' || clickType === 'Both') {
                    const clickCount = await Click.countDocuments(query);
                    console.log(`[ClicksCutoff] Clicks Count Check: Limit=${cutoffValue}, Current=${clickCount}`);
                    if (clickCount >= cutoffValue && cutoffValue > 0) {
                        return true;
                    }
                }

                if (clickType === 'Unique Clicks' || clickType === 'Both') {
                    const uniqueClicks = await Click.distinct('ip_address', query);
                    const uniqueCount = uniqueClicks.length;
                    console.log(`[ClicksCutoff] Unique Count Check: Limit=${cutoffValue}, Current=${uniqueCount}`);
                    if (uniqueCount >= cutoffValue && cutoffValue > 0) {
                        return true;
                    }
                }
            }
        } catch (err) {
            console.error('[ClicksCutoff] Error checking cutoff:', err);
            return false;
        }
    }

    return false; // No cutoff exceeded
};
// End Clicks Cutoff Logic

// ==========================================
// HANDLE CONVERSION (Inbound Postback)
// ==========================================
const handleConversion = async (req, res) => {
    try {
        const { click_id, payout, camp_id: queryCampId, goal_name, event } = req.query;

        // 1. Validation
        if (!click_id) {
            return res.status(400).json({ error: 'Missing click_id' });
        }

        // Fetch Click first to get camp_id for campaign lookup
        const click = await Click.findOne({ click_id });
        if (!click) {
            console.error(`[Conversion] Click not found for ID: ${click_id}`);
            return res.status(404).json({ error: 'Invalid click_id' });
        }

        const { camp_id, publisher_id, source, gaid, idfa, app_name, p1, p2 } = click;

        // Fetch Campaign to get defaultGoalName
        let campaign = null;
        try {
             if (mongoose.Types.ObjectId.isValid(camp_id)) {
                 campaign = await Campaign.findById(camp_id);
             }
             if (!campaign) {
                 const campIdNum = Number(camp_id);
                 if (!isNaN(campIdNum)) {
                     campaign = await Campaign.findOne({ campaignId: campIdNum });
                 }
             }
             if (!campaign) {
                 campaign = await Campaign.findOne({ campaignId: camp_id });
             }
        } catch(e) { console.error('Error fetching campaign for goal resolution:', e); }

        const finalGoalName = goal_name || event || (campaign ? campaign.defaultGoalName : '') || '';
        console.log(`[Conversion] Received for click_id: ${click_id}, payout: ${payout}, goal: ${finalGoalName}`);

        // 2. Prevent Duplicates
        const existingConv = await Conversion.findOne({ click_id });
        if (existingConv) {
            console.warn(`[Conversion] Duplicate conversion for click_id: ${click_id}`);
            return res.status(200).json({ message: 'Conversion already recorded' });
        }

        const advertiserPayout = parseFloat(payout) || 0;
        let finalPayout = advertiserPayout;

        // Calculate dynamic publisher payout if rules exist
        if (campaign && campaign.payouts && campaign.payouts.length > 0) {
            const rule = campaign.payouts.find(r => {
                const pubMatch = r.publisherId === String(publisher_id);
                const goalMatch = r.goalName.toLowerCase().trim() === finalGoalName.toLowerCase().trim();
                return pubMatch && goalMatch;
            });

            if (rule) {
                if (rule.payoutType === 'fixed') {
                    finalPayout = rule.payoutValue;
                } else if (rule.payoutType === 'percentage') {
                    finalPayout = (rule.payoutValue / 100) * advertiserPayout;
                }
                console.log(`[Conversion] Applied Payout Rule: ${rule.payoutType} value=${rule.payoutValue} -> finalPayout=${finalPayout}`);
            }
        }

        // 3. Save Conversion
        const newConversion = await Conversion.create({
            click_id,
            camp_id,
            publisher_id,
            payout: finalPayout,
            source,
            goal_name: finalGoalName,
            gaid,
            idfa,
            app_name,
            p1,
            p2,
            status: 'approved', 
            originalStatus: 'approved' 
        });

        // 4. Check Sampling
        let isSampled = false;
        let publisherObj = null; 
        if (campaign) {
            if (publisher_id) {
                try {
                    const allPublishers = await getAllPublishers();
                    publisherObj = allPublishers.find(p => p.id == publisher_id || p.referenceId == publisher_id || p._id == publisher_id);
                } catch(e) { console.error('Error fetching publisher for sampling:', e); }
            }
            
            isSampled = await checkIsSampled(campaign, publisherObj, source, publisher_id, finalGoalName);
        }

        if (isSampled) {
             console.log('[Conversion] Marked as SAMPLED');
             newConversion.status = 'sampled';
             newConversion.originalStatus = 'sampled'; // Preserve initial sampling decision
             await newConversion.save();
        }

        console.log('[Conversion] Saved to DB');


        // 6. Fire Trackier S2S Postback (ALWAYS FIRE to track revenue)
        fireTrackierPostback(click_id, finalPayout).catch(err => console.error('[Trackier] Error firing postback:', err));

        // 7. Fire Legacy Postbacks (ONLY IF NOT SAMPLED)
        if (!isSampled) {
            // Construct params for macro replacement
            const params = {
                click_id,
                payout: finalPayout,
                camp_id,
                publisher_id,
                source,
                goal_name: finalGoalName,
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
                    const publisher = publishers.find(p => p.id == publisher_id || p.referenceId == publisher_id);
                    if (publisher && publisher.postbackUrl) {
                        const pubPostbackUrl = replaceMacros(publisher.postbackUrl, params);
                        sendPostback(pubPostbackUrl, `Publisher ${publisher.id}`).catch(err => console.error('Publisher postback fatal error:', err));
                    }
                });
            }
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

        // Fetch campaign first to check cutoff settings
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

        // Check if click should be sampled before logging
        let isSampled = false;
        if (campaign && campaign.clicksSettings && campaign.clicksSettings.length > 0) {
            try {
                // Fetch publisher object for cutoff check
                let publisherObj = null;
                if (publisher_id) {
                    const allPublishers = await getAllPublishers();
                    publisherObj = allPublishers.find(p => 
                        p.id == publisher_id || 
                        p.referenceId == publisher_id || 
                        p._id == publisher_id
                    );
                }
                
                // Check cutoff - this returns true if cutoff is exceeded
                isSampled = await checkClicksCutoff(campaign, publisherObj, finalSource, publisher_id);
                console.log(`[Click] isSampled check result: ${isSampled}`);
            } catch (err) {
                console.error('[Click] Error checking cutoff:', err);
            }
        }

        // Log Click with isSampled flag (synchronous to ensure it's saved before redirect)
        try {
            await Click.create({
                click_id: finalClickId,
                camp_id: camp_id,
                publisher_id: publisher_id || '',
                source: finalSource,
                payout: 0,
                isSampled: isSampled,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent') || ''
            });
            console.log(`[Click] Saved with isSampled=${isSampled}`);
        } catch (e) {
            console.error('Click logging error:', e);
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

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
};

// Tracking and Postback Endpoints
router.get('/', handleTracking);
router.get('/conversion', handleConversion); // Dedicated conversion endpoint

module.exports = router;
