import { config } from 'dotenv';
config();
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

async function run() {
  const hash = await bcrypt.hash('admin', 10);
  
  // Update DEV DB
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, 'admin@vexora.com'));
  console.log("DEV DB ADMIN PASSWORD UPDATED");

  // Update PROD DB
  if (process.env.SQL_HOST) {
    const prodClient = postgres({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: 'cloud_sql_production_database',
      max: 1
    });
    await prodClient`UPDATE users SET password_hash = ${hash} WHERE email = 'admin@vexora.com'`;
    console.log("PROD DB ADMIN PASSWORD UPDATED");
  }

  process.exit(0);
}
run();
