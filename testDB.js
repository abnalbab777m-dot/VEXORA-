import { db } from './src/db/index.js';
import { paymentMethods } from './src/db/schema.js';

async function test() {
  const methods = await db.select().from(paymentMethods);
  console.log(methods);
  process.exit(0);
}
test();
