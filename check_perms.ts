import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER,
    password: process.env.SQL_ADMIN_PASSWORD,
    database: 'postgres',
    max: 1
  });

  try {
    const result = await client`
      SELECT has_database_privilege('ai_studio_app_user', 'cloud_sql_production_database', 'CONNECT');
    `;
    console.table(result);
  } catch(e) {
    console.error("ERR:", e);
  }
  process.exit(0);
}
run();
