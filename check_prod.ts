import https from 'https';

https.get('https://vexora-1.ai.studio/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HEALTH:', data));
}).on('error', err => console.log('ERR:', err.message));
