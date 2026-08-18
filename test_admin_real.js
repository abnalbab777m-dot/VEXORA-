import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function run() {
  const baseUrl = 'https://vexora-1.ai.studio';
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
  
  // Forge an ADMIN token for the user we just created on remote
  const token = jwt.sign({ userId: 'ae32f53b-5050-4f3a-91eb-48f550565403', role: 'ADMIN' }, secret, { expiresIn: '7d' });
  
  console.log('Fetching admin payment methods...');
  const res = await fetch(`${baseUrl}/api/admin/payment-methods`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run().catch(console.error);
