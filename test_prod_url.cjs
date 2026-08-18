const { Client } = require('pg');
const url = `postgresql://${process.env.SQL_USER}:${process.env.SQL_PASSWORD}@localhost/cloud_sql_production_database?host=${encodeURIComponent(process.env.SQL_HOST)}`;
const client = new Client({ connectionString: url });
client.connect()
  .then(() => client.query('SELECT 1 as val'))
  .then(res => { console.log('Prod URL Success:', res.rows); client.end(); })
  .catch(err => { console.error('Error:', err); });
