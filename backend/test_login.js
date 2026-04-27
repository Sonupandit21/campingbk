const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5002/api/auth/login', {
      email: '7844521458',
      password: 'somepassword' // The password doesn't matter for the "User not found" error
    });
    console.log('Login response:', response.data);
  } catch (error) {
    console.error('Login error:', error.response?.status, error.response?.data);
  }
}

testLogin();
