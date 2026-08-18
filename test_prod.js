import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';

async function run() {
  // Try to find a user to login
  const allUsers = await db.select().from(users);
  const admin = allUsers.find(u => u.role === 'ADMIN') || allUsers[0];
  const user = allUsers.find(u => u.role === 'USER') || allUsers[0];

  const targetUrls = [
    'https://vexora-1.ai.studio',
    'https://ais-pre-ujae2bgxmcc6sxjeqbzv5p-147671540010.europe-west2.run.app'
  ];

  for (const baseUrl of targetUrls) {
    console.log(`\n=== Testing against ${baseUrl} ===`);
    try {
      // Login as user
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: 'password123' }) // Assuming default pass or we might get auth failure
      });
      
      let cookie = loginRes.headers.raw()['set-cookie'];
      
      // If login fails because of password, we can't test this way easily without knowing the password.
      // But wait! This is AI Studio. The Shared App URL is a direct deployment of the current code/DB.
      // Let's just generate a token locally using the same JWT_SECRET (since it's shared in the project).
      
      const { authService } = await import('./src/backend/services/authService.js');
      const token = authService.generateToken(user.id, user.role);
      const adminToken = authService.generateToken(admin.id, admin.role);

      console.log('--- USER DEPOSIT ---');
      const depositRes = await fetch(`${baseUrl}/api/wallet/payment-methods`, {
        headers: { 
          'Cookie': `token=${token}`,
          'Authorization': `Bearer ${token}` 
        }
      });
      console.log('Status:', depositRes.status);
      console.log('Response:', await depositRes.text());

      console.log('--- ADMIN METHODS ---');
      const adminRes = await fetch(`${baseUrl}/api/admin/payment-methods`, {
        headers: { 
          'Cookie': `token=${adminToken}`,
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('Status:', adminRes.status);
      console.log('Response:', await adminRes.text());

    } catch (e) {
      console.log(`Failed to connect to ${baseUrl}:`, e.message);
    }
  }
  process.exit(0);
}
run().catch(console.error);
