import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: 'cloud_sql_production_database',
  max: 1
});

async function run() {
  try {
    console.log("PRODUCTION DATABASE CONNECTION STATUS: OK");
    const res1 = await pool.query('SELECT current_database() as current_db');
    console.log("CURRENT DATABASE:", res1.rows[0].current_db);
    
    const res2 = await pool.query('SELECT current_user as current_usr');
    console.log("CURRENT USER:", res2.rows[0].current_usr);
    
    const res3 = await pool.query('SELECT current_schema() as current_sch');
    console.log("CURRENT SCHEMA:", res3.rows[0].current_sch);
    
    const res4 = await pool.query('SELECT version() as ver');
    console.log("VERSION:", res4.rows[0].ver);
    
    const res5 = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users'");
    console.log("USERS TABLE:", res5.rows);
    
    const res6 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
    console.log("USERS COLUMNS:", res6.rows);
    
    const res7 = await pool.query("SELECT id, username, email, role, status FROM users WHERE email = 'admin@vexora.com' LIMIT 1");
    console.log("ADMIN ROW:", res7.rows[0]);
    
  } catch(e: any) {
    console.error("DB ERROR:", e);
  } finally {
    await pool.end();
  }
}
run();
