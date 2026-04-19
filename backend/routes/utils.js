const express = require('express');
const router = express.Router();

router.get('/my-ip', (req, res) => {
  // Use a helper to extract IP similar to tracking logic
  let clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  
  if (typeof clientIp === 'string') {
    clientIp = clientIp.split(',')[0].trim();
  }
  
  // For local testing, generate random IPs so UI shows "Global-like" IP
  if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.includes('127.0.0.1') || clientIp.includes('::ffff:127.0.0.1')) {
    clientIp = `127.0.0.${Math.floor(Math.random() * 254) + 1}`;
  }
  
  res.json({ ip: clientIp });
});

module.exports = router;
