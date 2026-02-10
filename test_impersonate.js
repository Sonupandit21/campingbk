const http = require('http');

const data = JSON.stringify({
  publisherId: '123' 
});

const options = {
  hostname: 'localhost',
  port: 5555,
  path: '/api/auth/admin/impersonate-publisher',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    // Mocking auth if necessary, but just checking 404 vs 403 vs 200
    // If 403, it means route exists but auth blocked (which is GOOD, not 404)
  }
};

console.log('Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
