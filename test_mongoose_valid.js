const mongoose = require('mongoose');

console.log("Mongoose Version:", mongoose.version);

const testValues = [
    1,
    "1",
    123,
    "123",
    "507f1f77bcf86cd799439011", // Valid ObjectId
    "507f1f77bcf86cd79943901",  // Invalid length
    undefined,
    null
];

testValues.forEach(val => {
    try {
        const isValid = mongoose.Types.ObjectId.isValid(val);
        console.log(`Value: ${val} (${typeof val}) -> isValid: ${isValid}`);
    } catch (e) {
        console.log(`Value: ${val} (${typeof val}) -> Error: ${e.message}`);
    }
});
