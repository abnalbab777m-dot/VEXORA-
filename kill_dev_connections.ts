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
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'cloud_sql_development_database'
        AND pid <> pg_backend_pid();
    `;
    console.log(`Killed ${result.length} dev connections.`);
  } catch(e) {
    console.error("ERR:", e.message);
  }
  process.exit(0);
}
run();
