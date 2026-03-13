const { authOptions } = require('./src/lib/auth');
const bcrypt = require('bcryptjs');

async function simulateLogin() {
  const credentials = {
    email: 'gtorreshbl@gmail.com',
    password: 'g250491'
  };

  try {
    console.log('--- Simulating Authorize ---');
    const user = await authOptions.providers[0].authorize(credentials);
    console.log('Result:', user ? 'SUCCESS' : 'FAILED');
    if (user) console.log('User Role:', user.role);
  } catch (e) {
    console.error('Authorize Threw Error:', e.message);
  }
  process.exit(0);
}

simulateLogin();
