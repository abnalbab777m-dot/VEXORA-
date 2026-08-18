import { db } from './src/db/index.js';
import { paymentMethods } from './src/db/schema.js';

async function run() {
  console.log('--- QUERYING POSTGRESQL ---');
  try {
    const methods = await db.select().from(paymentMethods);
    console.log(`Payment Methods Count: ${methods.length}`);
    methods.forEach(m => console.log(`- ${m.name} (Active: ${m.isActive})`));
  } catch (err) {
    console.error('Database Error:', err);
  }
  process.exit(0);
}
run();
