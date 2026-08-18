import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const baseUrl = 'https://vexora-1.ai.studio';
  const username = 'TEST_DB_ISOLATION_' + Date.now();
  const email = username + '@example.com';
  
  console.log(`Registering ${username} on ${baseUrl}...`);
  await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password: 'Password123!', confirmPassword: 'Password123!' })
  });
  
  // Now check local DB
  const localUser = await db.select().from(users).where(eq(users.username, username));
  if (localUser.length > 0) {
    console.log('User found in local DB! They share the same database.');
  } else {
    console.log('User NOT found in local DB! Vexora-1 uses a DIFFERENT database.');
  }
  process.exit(0);
}
run().catch(console.error);
