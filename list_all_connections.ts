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
      SELECT pid, datname, usename, client_addr, application_name, state
      FROM pg_stat_activity;
    `;
    console.table(result);
  } catch(e) {
    console.error("ERR:", e);
  }
  process.exit(0);
}
run();
