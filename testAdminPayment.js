import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { authService } from './src/backend/services/authService.js';

async function run() {
  const allUsers = await db.select().from(users);
  let admin = allUsers.find(u => u.role === 'ADMIN');
  const token = authService.generateToken(admin.id, admin.role);

  const res = await fetch('http://localhost:3000/api/admin/payment-methods', {
    headers: { cookie: `token=${token}` }
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
  
  // Test POST
  const postRes = await fetch('http://localhost:3000/api/admin/payment-methods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `token=${token}` },
    body: JSON.stringify({
      name: 'Test Method',
      type: 'BANK',
      details: { account: 'test' },
      isActive: true,
      displayOrder: 5
    })
  });
  console.log(postRes.status);
  const postData = await postRes.json();
  console.log(postData);
  process.exit(0);
}
run();
