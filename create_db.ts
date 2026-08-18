import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER, // ai_studio_app_user
    password: process.env.SQL_PASSWORD,
    database: 'postgres',
    max: 1
  });

  try {
    await client`CREATE DATABASE ai_studio_app_user`;
    console.log("Database created!");
  } catch(e) {
    console.error("ERR:", e.message);
  }
  process.exit(0);
}
run();
