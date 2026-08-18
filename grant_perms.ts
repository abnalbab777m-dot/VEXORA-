import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function run() {
  const client = postgres({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'postgres',
    max: 1
  });

  try {
    await client`GRANT ALL ON SCHEMA public TO ${client(process.env.SQL_USER)}`;
    console.log("Granted!");
  } catch(e) {
    console.error("ERR:", e.message);
  }
  process.exit(0);
}
run();
