
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const Conversion = require('./models/Conversion');
const Publisher = require('./models/Publisher');

const logFile = 'debug_output.txt';
// Clear old file
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

function log(msg) {
    console.log(msg); // Keep terminal output for verification
    fs.appendFileSync(logFile, msg + '\n');
}

async function debugState() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to DB');

        // 1. Find all campaigns with "sonu" sampling rule (regex)
        const campaigns = await Campaign.find({ "sampling.publisherName": /sonu/i });
        log(`Found ${campaigns.length} campaigns for 'Sonu'.`);
        
        for (const c of campaigns) {
            log(`\n\n--- CAMPAIGN ---`);
            log(`Title: "${c.title}"`);
            log(`campaignId: '${c.campaignId}' (Type: ${typeof c.campaignId})`);
            log(`_id: ${c._id} (Type: ${typeof c._id})`);
            
            if (c.sampling) {
                c.sampling.forEach((r, i) => {
                    log(`  Rule #${i+1}: PubID='${r.publisherId}', Name='${r.publisherName}', Value=${r.samplingValue}, Type=${r.subIdsType}`);
                });
            } else {
                log('  No sampling rules.');
            }

            // 2. Check Recent Conversions for this campaign
            // Trying both ID types for thoroughness
            const conversions = await Conversion.find({ camp_id: c.campaignId }).sort({ createdAt: -1 }).limit(3);
            if (conversions.length > 0) {
                log(`  Recent Conversions (matched by c.campaignId):`);
                conversions.forEach(conv => {
                    log(`    - ClickID: ${conv.click_id}`);
                    log(`      CampID in Conv: '${conv.camp_id}' (Type: ${typeof conv.camp_id})`);
                    log(`      PubID: '${conv.publisher_id}'`);
                    log(`      Status: ${conv.status}`);
                    log(`      Source: '${conv.source}'`);
                });
            } else {
                log(`  No recent conversions found for camp_id: ${c.campaignId}`);
            }
        }

    } catch (e) {
        log('Error: ' + e.message);
    } finally {
        await mongoose.disconnect();
    }
}

debugState();
