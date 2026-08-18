const postgres = require('postgres');
const sql = postgres({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME
});

async function main() {
  const res = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users';
  `;
  console.log(res);
  process.exit(0);
}
main();
