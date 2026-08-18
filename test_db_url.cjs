const { Client } = require('pg');
const sqlUser = process.env.SQL_USER;
const sqlPass = process.env.SQL_PASSWORD;
const sqlHost = process.env.SQL_HOST;
const sqlDb = 'cloud_sql_production_database';

// Check if encoding is needed
const needsEncoding = encodeURIComponent(sqlPass) !== sqlPass;

// Construct URL
const url = `postgres://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${encodeURIComponent(sqlHost)}`;

const client = new Client({ connectionString: url });

client.connect()
  .then(() => client.query('SELECT 1 as val'))
  .then(res1 => {
    client.query('SELECT current_database() as db')
      .then(res2 => {
        console.log(JSON.stringify({
          construction: 'VALID',
          encodingNeeded: needsEncoding ? 'REQUIRED' : 'NOT REQUIRED',
          select1: res1.rows[0].val === 1 ? 'PASS' : 'FAIL',
          db: res2.rows[0].db
        }));
        client.end();
      });
  })
  .catch(err => {
    console.error(JSON.stringify({
      construction: 'INVALID',
      error: err.message
    }));
  });
