import { db } from './index';
import { paymentMethods } from './schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedPaymentMethods() {
  if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER)) {
    console.log('Database is not configured. Skipping seed.');
    return;
  }
  
  const methods = [
    {
      name: 'Turkish Bank',
      type: 'BANK',
      details: { accountHolder: 'RUBA ALİ AL HUSSEİN', iban: 'TR77 0082 9000 0949 1962 5420 51' },
      displayOrder: 1
    },
    {
      name: 'Sham Cash — USD',
      type: 'E_WALLET',
      details: { address: '2f06deb324861ace61b595af570a7dfa' },
      displayOrder: 2
    },
    {
      name: 'USDT — BEP20',
      type: 'CRYPTO',
      details: { network: 'BEP20', address: '0x6b0dd72b14e64f75cf4355d1bca128f14c950647' },
      displayOrder: 3
    },
    {
      name: 'USDT — TRC20',
      type: 'CRYPTO',
      details: { network: 'TRC20', address: 'TYXk6MdKCRNcj84sDtTVe1rwdqJStQWfVB' },
      displayOrder: 4
    }
  ];

  for (const pm of methods) {
    const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.name, pm.name)).limit(1).then(res => res[0]);
    if (!existing) {
      await db.insert(paymentMethods).values(pm);
      console.log(`Created payment method: ${pm.name}`);
    } else {
      console.log(`Payment method already exists: ${pm.name}`);
    }
  }
}

seedPaymentMethods().catch(console.error).finally(() => process.exit(0));
