const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
require('dotenv').config();

const updates = [
    {
        id: 1,
        overrideUrl: "https://jjkjdnc.gotrackier.com/click?campaign_id=5082&pub_id=2&p1={click_id}&source={source}"
    },
    {
        id: 3,
        overrideUrl: "https://unstop.com/jobs/ai-marketing-manager-peppyduck-ventures-llp-1633086?utm_source=Affiliate&utm_medium=Affiliates&utm_campaign=trackier_1663&click_id=698222d649a610034d77d214&ref=Affbrandshapers2_{source}"
    }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    for (const update of updates) {
        const res = await Campaign.findOneAndUpdate(
            { campaignId: update.id },
            { overrideUrl: update.overrideUrl },
            { new: true }
        );
        if (res) {
            console.log(`Updated Campaign ${update.id} with overrideUrl`);
        } else {
            console.log(`Campaign ${update.id} not found! Creating it...`);
             // Optional: Create if not exists with dummy data just to make it work? 
             // Better to just warn. But if the user deleted DB, we might need to recreate.
             // Let's rely on the user having created them via UI, or we create minimal placeholders.
             await Campaign.create({
                 campaignId: update.id,
                 title: `Campaign ${update.id} (Restored)`,
                 defaultUrl: update.overrideUrl, // Use override as default
                 overrideUrl: update.overrideUrl,
                 status: 'Active'
             });
             console.log(`Created Campaign ${update.id}`);
        }
    }
    
    console.log('Done');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
