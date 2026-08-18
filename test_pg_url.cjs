const { Client } = require('pg');
const url = `postgresql://${process.env.SQL_USER}:${process.env.SQL_PASSWORD}@localhost/${process.env.SQL_DB_NAME}?host=${encodeURIComponent(process.env.SQL_HOST)}`;
console.log("URL format:", url.replace(process.env.SQL_PASSWORD, '****'));
const client = new Client({ connectionString: url });
client.connect()
  .then(() => client.query('SELECT 1 as val'))
  .then(res => { console.log('Success:', res.rows); client.end(); })
  .catch(err => { console.error('Error:', err); });
