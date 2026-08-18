const { db } = require('./check_db.js');
async function test() {
  const { games, gameStakes, matchmakingQueue } = await import('./dist/server.cjs').then(m => m.db); // wait, esbuild bundled it.
}
