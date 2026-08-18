import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { authService } from './src/backend/services/authService.js';

async function run() {
  const allUsers = await db.select().from(users);
  let player = allUsers.find(u => u.role === 'USER');
  const token = authService.generateToken(player.id, player.role);

  const res = await fetch('http://localhost:3000/api/wallet/payment-methods', {
    headers: { cookie: `token=${token}` }
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
  process.exit(0);
}
run();
