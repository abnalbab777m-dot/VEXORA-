import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { authService } from './src/backend/services/authService.js';

async function run() {
  const allUsers = await db.select().from(users);
  let admin = allUsers.find(u => u.role === 'ADMIN');
  if (!admin) {
    admin = allUsers[0];
  }
  const token = authService.generateToken(admin.id, 'ADMIN');

  console.log('Testing GET /api/admin/payment-methods with ADMIN token');
  
  const res = await fetch('http://localhost:3000/api/admin/payment-methods', {
    headers: { cookie: `token=${token}` }
  });
  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Response Body:', text);
  process.exit(0);
}
run().catch(console.error);
