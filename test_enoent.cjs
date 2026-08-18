const net = require('net');
const client = net.createConnection('/app/cloudsql/does-not-exist/.s.PGSQL.5432');
client.on('error', (err) => console.log('Error:', err.code));
