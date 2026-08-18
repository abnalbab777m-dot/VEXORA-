import { db } from './src/db/index.js';
import { paymentMethods } from './src/db/schema.js';

async function run() {
  const methods = await db.select().from(paymentMethods);
  console.log('All methods in DB:', methods);
  process.exit(0);
}
run().catch(console.error);
