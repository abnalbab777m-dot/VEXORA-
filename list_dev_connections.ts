import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'cloud_sql_development_database',
    max: 1
  });

  try {
    const result = await client`
      SELECT pid, datname, usename, state, query
      FROM pg_stat_activity
      WHERE datname = 'cloud_sql_development_database';
    `;
    console.table(result);
  } catch(e) {
    console.error("ERR:", e);
  }
  process.exit(0);
}
run();
