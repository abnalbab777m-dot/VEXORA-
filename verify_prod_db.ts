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
    const result = await client`
      SELECT id, username, email, role, status, password_hash
      FROM users
      WHERE email = 'admin@vexora.com';
    `;
    console.log("DB VERIFICATION RESULTS:");
    console.table(result);
  } catch(e) {
    console.error("ERR:", e.message);
  }
  process.exit(0);
}
run();
