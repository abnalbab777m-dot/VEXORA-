import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { authService } from './src/backend/services/authService.js';

async function run() {
  const allUsers = await db.select().from(users);
  let player = allUsers.find(u => u.role === 'USER');
  let admin = allUsers.find(u => u.role === 'ADMIN') || allUsers[0];
  
  const userToken = authService.generateToken(player.id, player.role);
  const adminToken = authService.generateToken(admin.id, admin.role);

  console.log('--- E2E TEST: USER DEPOSIT ---');
  const userRes = await fetch('http://localhost:3000/api/wallet/payment-methods?t=' + Date.now(), {
    headers: { cookie: `token=${userToken}` }
  });
  console.log('User Status:', userRes.status);
  console.log('User Body:', await userRes.text());

  console.log('\n--- E2E TEST: ADMIN METHODS ---');
  const adminRes = await fetch('http://localhost:3000/api/admin/payment-methods?t=' + Date.now(), {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Admin Status:', adminRes.status);
  console.log('Admin Body:', await adminRes.text());
  
  process.exit(0);
}
run().catch(console.error);
