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
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users';
    `;
    console.log("COLUMNS IN PROD:", result.map(r => r.column_name));
  } catch(e) {
    console.error("ERR:", e);
  }
  process.exit(0);
}
run();
