const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
const Campaign = require('./models/Campaign');
const Publisher = require('./models/Publisher');
require('dotenv').config();

// Mimic the logic from reports.js EXACTLY including lookups
async function runReport(startDateStr, endDateStr) {
    console.log(`Running FULL report for ${startDateStr} to ${endDateStr}`);

    const match = {};
    if (startDateStr || endDateStr) {
      match.timestamp = {};
      if (startDateStr) match.timestamp.$gte = new Date(startDateStr);
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        match.timestamp.$lte = end;
      }
    }
    
    // Aggregation pipelines
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

    try {
        console.log('Running Aggregations...');
        const [clickResults, conversionResults] = await Promise.all([
          Click.aggregate(clickPipeline),
          Conversion.aggregate(conversionPipeline)
        ]);
        
        console.log(`Clicks: ${clickResults.length}, Conversions: ${conversionResults.length}`);

        // --- LOOKUP LOGIC START ---
        console.log('Starting Lookup Logic...');
        let campMap = {};
        let pubMap = {};

        try {
            const distinctCampIds = [...new Set([...clickResults, ...conversionResults].map(x => x._id.camp_id).filter(Boolean))];
            const distinctPubIds = [...new Set([...clickResults, ...conversionResults].map(x => x._id.publisher_id).filter(Boolean))];

            console.log('Distinct Camp IDs:', distinctCampIds);
            console.log('Distinct Pub IDs:', distinctPubIds);

            const campaigns = await Campaign.find({
                campaignId: { $in: distinctCampIds } 
            }).select('campaignId title');

            const publishers = await Publisher.find({
                publisherId: { $in: distinctPubIds }
            }).select('publisherId fullName');
            
            console.log(`Found ${campaigns.length} campaigns and ${publishers.length} publishers`);

            campaigns.forEach(c => campMap[c.campaignId] = c.title);
            publishers.forEach(p => pubMap[p.publisherId] = p.fullName);
        } catch (lookupErr) {
            console.error('[Reports] Name lookup error (non-fatal):', lookupErr);
            throw lookupErr; // Re-throw to see if it crashes the script
        }
        // --- LOOKUP LOGIC END ---

        console.log('Report generated successfully!');
        
    } catch (err) {
        console.error('CRITICAL REPORT ERROR:', err);
    }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    // Test with the date range from screenshot
    await runReport('01/29/2026', '02/05/2026');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
