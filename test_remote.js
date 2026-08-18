import fetch from 'node-fetch';

async function run() {
  const baseUrl = 'https://vexora-1.ai.studio';
  
  const username = 'testuser_' + Date.now();
  const email = username + '@example.com';
  const password = 'Password123!';
  
  console.log(`Registering ${username} on ${baseUrl}...`);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, confirmPassword: password })
  });
  
  const regStatus = regRes.status;
  const regBody = await regRes.text();
  console.log('Reg status:', regStatus, 'Body:', regBody);

  let cookies = regRes.headers.raw()['set-cookie'] || [];
  let tokenCookie = cookies.find(c => c.startsWith('token='));

  const cookieStr = tokenCookie ? tokenCookie.split(';')[0] : '';
  console.log('Cookie obtained:', cookieStr);

  console.log('\nFetching payment methods from published backend...');
  const pmRes = await fetch(`${baseUrl}/api/wallet/payment-methods?t=${Date.now()}`, {
    headers: { 'Cookie': cookieStr }
  });
  
  console.log('Status:', pmRes.status);
  console.log('Body:', await pmRes.text());
}
run().catch(console.error);
