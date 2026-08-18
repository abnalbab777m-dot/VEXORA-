const { Client } = require('pg');
const url = `postgres://${process.env.SQL_USER}:${encodeURIComponent(process.env.SQL_PASSWORD)}@localhost/cloud_sql_development_database?host=${process.env.SQL_HOST}`;
const client = new Client({ connectionString: url });
client.connect()
  .then(() => client.query('SELECT 1 as val'))
  .then(res => { console.log('Unix URL Success:', res.rows); client.end(); })
  .catch(err => { console.error('Error:', err); });
