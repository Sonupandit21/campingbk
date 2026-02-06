const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');
require('dotenv').config();

async function runReportDebug() {
  console.log('--- START REPORT DEBUG ---');
  
  try {
    // Simulate Request Params
    const startDate = '2026-01-30';
    const endDate = '2026-02-06';
    const campaignId = undefined;
    const publisherId = undefined;

    console.log(`Params: ${startDate} to ${endDate}`);

    // Base match criteria
    const match = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.timestamp.$lte = end;
      }
    }
    
    // Note: Click/Conversion models store IDs as Strings based on current schema
    if (campaignId) match.camp_id = campaignId;
    if (publisherId) match.publisher_id = publisherId;

    console.log('Match Criteria:', JSON.stringify(match));

    // Define aggregation pipeline for Clicks
    const clickPipeline = [
      { $match: match },
      {
        $group: {
          _id: {
             date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
             camp_id: "$camp_id",
             publisher_id: "$publisher_id"
          },
          clicks: { $sum: 1 }
        }
      }
    ];

    console.log('Running Click Aggregation...');
    // RUN SEPARATELY TO ISOLATE
    try {
        const clickTest = await Click.aggregate(clickPipeline);
        console.log(`Click Aggregation Success. Result Count: ${clickTest.length}`);
    } catch (e) {
        console.error('CLICK AGGREGATION FAILED:', e);
        throw e; // Stop here if fails
    }

    // Define aggregation pipeline for Conversions
    const conversionMatch = { ...match };
    if (match.timestamp) {
        conversionMatch.createdAt = match.timestamp;
        delete conversionMatch.timestamp;
    }

    const conversionPipeline = [
      { $match: conversionMatch },
      {
        $group: {
          _id: {
             date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
             camp_id: "$camp_id",
             publisher_id: "$publisher_id"
          },
          conversions: { $sum: 1 },
          payout: { $sum: "$payout" }
        }
      }
    ];

    console.log('Running Conversion Aggregation...');
    try {
        const convTest = await Conversion.aggregate(conversionPipeline);
        console.log(`Conversion Aggregation Success. Result Count: ${convTest.length}`);
    } catch (e) {
         console.error('CONVERSION AGGREGATION FAILED:', e);
         throw e;
    }

    console.log('--- END REPORT DEBUG: SUCCESS ---');

  } catch (error) {
    console.error('--- REPORT DEBUG FATAL ERROR ---');
    console.error(error);
  } finally {
      process.exit();
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to DB');
    runReportDebug();
  })
  .catch(err => {
    console.error('DB Connection Failed:', err);
    process.exit(1);
  });
