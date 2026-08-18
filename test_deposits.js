import fetch from 'node-fetch';
import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { authService } from './src/backend/services/authService.ts';

async function run() {
  const baseUrl = 'http://localhost:3000';
  
  const allUsers = await db.select().from(users);
  const user = allUsers.find(u => u.role === 'USER') || allUsers[0];
  const token = authService.generateToken(user.id, user.role);
  const tokenCookie = `token=${token}`;

  const pmRes = await fetch(`${baseUrl}/api/wallet/payment-methods`, {
    headers: { 'Cookie': tokenCookie, 'Authorization': `Bearer ${token}` }
  });
  const pmData = await pmRes.tson();
  const methods = pmData.data;

  if (!methods) {
      console.log('Error fetching methods', pmData);
      return;
  }

  const bank = methods.find(m => m.type === 'BANK');
  const ewallet = methods.find(m => m.type === 'E_WALLET');
  const crypto = methods.find(m => m.type === 'CRYPTO');

  const headers = { 'Content-Type': 'application/json', 'Cookie': tokenCookie, 'Authorization': `Bearer ${token}` };

  console.log('\n--- DEPOSIT TURKISH BANK ---');
  let res = await fetch(`${baseUrl}/api/wallet/deposit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: '5', idempotencyKey: 'bank-'+Date.now(), paymentMethodId: bank.id, senderName: 'Ahmed Ali' })
  });
  let data = await res.tson();
  console.log('Response:', data);

  console.log('\n--- DEPOSIT SHAM CASH ---');
  res = await fetch(`${baseUrl}/api/wallet/deposit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: '6', idempotencyKey: 'sham-'+Date.now(), paymentMethodId: ewallet.id, senderName: 'Sham User' })
  });
  data = await res.tson();
  console.log('Response:', data);

  console.log('\n--- DEPOSIT USDT ---');
  res = await fetch(`${baseUrl}/api/wallet/deposit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: '7', idempotencyKey: 'usdt-'+Date.now(), paymentMethodId: crypto.id, transactionHash: '0x123abc' })
  });
  data = await res.tson();
  console.log('Response:', data);

  console.log('\n--- WITHDRAW ---');
  res = await fetch(`${baseUrl}/api/wallet/withdraw`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: '10', idempotencyKey: 'with-'+Date.now(), paymentMethodId: bank.id, withdrawalDetails: { accountName: 'Ahmed Ali Withdraw', iban: 'TR12345' } })
  });
  data = await res.tson();
  console.log('Response:', data);
  
}
run().catch(console.error);
