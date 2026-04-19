const mongoose = require('mongoose');
const Publisher = require('./models/Publisher');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campingbk';

async function runTest() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");
        console.log("Mongoose Version:", mongoose.version);

        const publisherId = "2"; // Simulate req.body input

        // Exact logic from auth.js
        let query;

        // Check if it's a valid ObjectId (Strict 24 hex chars)
        const isObjectId = mongoose.Types.ObjectId.isValid(publisherId) && /^[0-9a-fA-F]{24}$/.test(publisherId);
        
        console.log(`Input: "${publisherId}"`);
        console.log(`isObjectId: ${isObjectId} (isValid: ${mongoose.Types.ObjectId.isValid(publisherId)})`);
        console.log(`isNaN: ${isNaN(publisherId)}`);

        if (isObjectId) {
            query = { _id: publisherId };
            console.log("Query Mode: _id");
        } else if (!isNaN(publisherId)) {
            // Assume it's the numeric publisherId
            query = { publisherId: Number(publisherId) };
            console.log("Query Mode: publisherId (Number)");
        } else {
            console.log("Invalid format");
            return;
        }

        console.log("Executing Query:", query);

        const publisher = await Publisher.findOne(query);
        console.log("Result:", publisher ? "Found: " + publisher.fullName : "Not Found");

        // Force a known bad query to see if we can trigger the specific error message
        try {
             console.log("Attempting forced bad query...");
             // This is what we SUSPECT is happening if logic falls through
             await Publisher.findOne({ _id: "2" }); 
        } catch(e) {
            console.log("Caught expected error from bad query:", e.message);
        }

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
