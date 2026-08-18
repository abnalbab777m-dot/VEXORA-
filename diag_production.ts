import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';
import { Pool } from 'pg';

async function run() {
  console.log("Connecting using Pool...");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'cloud_sql_production_database',
    max: 1
  });
  
  try {
    const res = await pool.query('SELECT current_database()');
    console.log("current_database:", res.rows[0]);
    
    const res2 = await pool.query('SELECT current_schema()');
    console.log("current_schema:", res2.rows[0]);
    
    const res3 = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log("Columns:", res3.rows.map(r => r.column_name).join(', '));
    
    const res4 = await pool.query(`
      SELECT id, username, email, role, status
      FROM users
      WHERE email = 'admin@vexora.com'
      LIMIT 1;
    `);
    console.log("Admin Row:", res4.rows[0]);
  } catch(e) {
    console.error("PG ERR:", e);
  } finally {
    await pool.end();
  }
}
run();
