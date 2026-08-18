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
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;
    console.table(result);
  } catch(e) {
    console.error("ERR:", e.message);
  }
  process.exit(0);
}
run();
