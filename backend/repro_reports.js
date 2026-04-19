const mongoose = require('mongoose');
const Click = require('./models/Click');
const Conversion = require('./models/Conversion');
require('dotenv').config();

// Mimic the logic from reports.js
async function runReport(startDateStr, endDateStr) {
    console.log(`Running report for ${startDateStr} to ${endDateStr}`);

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
    
    console.log('Click Match Criteria:', JSON.stringify(match, null, 2));

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
    
    console.log('Conversion Match Criteria:', JSON.stringify(conversionMatch, null, 2));

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
        const clicks = await Click.aggregate(clickPipeline);
        const conversions = await Conversion.aggregate(conversionPipeline);
        
        console.log(`Clicks Result Count: ${clicks.length}`);
        if (clicks.length > 0) console.log('Sample Click Group:', JSON.stringify(clicks[0]));

        console.log(`Conversions Result Count: ${conversions.length}`);
        if (conversions.length > 0) console.log('Sample Conv Group:', JSON.stringify(conversions[0]));
        
    } catch (err) {
        console.error('Aggregation Error:', err);
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
