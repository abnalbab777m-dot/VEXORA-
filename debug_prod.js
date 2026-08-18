import fetch from 'node-fetch';

const BASE_URL = 'https://ais-pre-ujae2bgxmcc6sxjeqbzv5p-147671540010.europe-west2.run.app';

async function run() {
  console.log('--- TESTING PROD API ---');
  // First, we need to login to get a token. We don't have the token locally, but we can register a test user.
  const email = `test_${Date.now()}@vexora.com`;
  
  console.log('1. Registering test user on PROD...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `test_${Date.now()}`, email, password: 'password123' })
  });
  
  console.log('Register Status:', regRes.status);
  
  // We can get the cookie from the response.
  const cookies = regRes.headers.raw()['set-cookie'];
  console.log('Cookies:', cookies);
  
  let tokenCookie = null;
  if (cookies) {
    tokenCookie = cookies.find(c => c.startsWith('token='));
  }
  
  let token = null;
  if (tokenCookie) {
    token = tokenCookie.split(';')[0];
  } else {
    const regData = await regRes.json();
    token = `token=${regData.data.token}`;
  }
  console.log('Token Cookie:', token);
  
  console.log('\n2. Testing GET /api/wallet/payment-methods on PROD...');
  const pmRes = await fetch(`${BASE_URL}/api/wallet/payment-methods`, {
    headers: { 'Cookie': token }
  });
  
  console.log('Payment Methods Status:', pmRes.status);
  const pmText = await pmRes.text();
  console.log('Payment Methods Response:', pmText);
  
  process.exit(0);
}
run().catch(console.error);
