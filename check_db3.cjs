const postgres = require('postgres');
const sql = postgres({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME
});

async function main() {
  const users = await sql`SELECT count(*) FROM users`;
  console.log('users count:', users[0].count);
  process.exit(0);
}
main();
