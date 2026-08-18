import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './src/db/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'postgres',
    max: 1
  });
  
  try {
    await client`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      avatar TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;
    await client`INSERT INTO users (username, email, password_hash, role) VALUES ('VexoraAdmin', 'admin@vexora.com', '$2b$10$qd9DGbb087bi7dgrBiFFoeOXBYxtEANm01iL3Ya8Gib6/ijGFNZFu', 'ADMIN') ON CONFLICT DO NOTHING`;
    console.log("Seeded postgres db");
  } catch(e) {
    console.log("ERR:", e);
  }
  process.exit(0);
}
run();
