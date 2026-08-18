import { db } from './src/db/index.js';
import { paymentMethods } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  await db.delete(paymentMethods).where(eq(paymentMethods.name, 'Test Method'));
  console.log('Deleted test method');
  process.exit(0);
}
run();
