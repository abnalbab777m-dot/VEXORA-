import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const prodClient = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER,
    password: process.env.SQL_ADMIN_PASSWORD,
    database: 'cloud_sql_production_database',
    max: 1
  });
  
  const userClient = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'ai_studio_app_user',
    max: 1
  });

  try {
    const prodDb = drizzle(prodClient, { schema });
    const userDb = drizzle(userClient, { schema });

    const adminUser = await prodDb.select().from(schema.users).where(eq(schema.users.email, 'admin@vexora.com'));
    
    if (adminUser.length > 0) {
      console.log("Found admin user in prod DB:", adminUser[0].email);
      // check if it exists in user DB
      const existing = await userDb.select().from(schema.users).where(eq(schema.users.email, 'admin@vexora.com'));
      if (existing.length === 0) {
        await userDb.insert(schema.users).values(adminUser[0]);
        console.log("Copied admin user to user DB!");
      } else {
        console.log("Admin user already in user DB");
      }
    } else {
      console.log("Admin user NOT FOUND in prod DB!");
    }
  } catch(e) {
    console.error("ERR:", e);
  }
  process.exit(0);
}
run();
