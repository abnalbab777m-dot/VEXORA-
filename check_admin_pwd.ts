import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'cloud_sql_production_database',
    max: 1
  });

  try {
    const result = await client`SELECT password_hash FROM users WHERE email = 'admin@vexora.com'`;
    console.log("CURRENT PROD HASH:", result[0]?.password_hash);
  } catch(e) {
    console.error("ERR:", e);
  }
  process.exit(0);
}
run();
