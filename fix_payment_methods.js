import fs from 'fs';

let code = fs.readFileSync('src/backend/services/walletService.ts', 'utf8');

const oldMethod = `  async getActivePaymentMethods() {
    if (!hasDatabase()) return [];
    return await db.query.paymentMethods.findMany({
      where: (paymentMethods, { eq }) => eq(paymentMethods.isActive, true),
      orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
    });
  }`;

const newMethod = `  async getActivePaymentMethods() {
    if (!hasDatabase()) return [];
    try {
      const { db } = await import('../../db/index');
      const { paymentMethods } = await import('../../db/schema');
      let methods = await db.query.paymentMethods.findMany({
        where: (paymentMethods, { eq }) => eq(paymentMethods.isActive, true),
        orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
      });
      
      // Seed default payment methods if database is completely empty
      if (methods.length === 0) {
        console.log('Seeding default payment methods...');
        const defaultMethods = [
          { name: 'Turkish Bank', type: 'BANK', details: { iban: 'TR77 0082 9000 0949 1962 5420 51', accountHolder: 'RUBA ALİ AL HUSSEİN' }, isActive: true, displayOrder: 1 },
          { name: 'Sham Cash — USD', type: 'E_WALLET', details: { address: '2f06deb324861ace61b595af570a7dfa' }, isActive: true, displayOrder: 2 },
          { name: 'USDT — BEP20', type: 'CRYPTO', details: { address: '0x6b0dd72b14e64f75cf4355d1bca128f14c950647', network: 'BEP20' }, isActive: true, displayOrder: 3 },
          { name: 'USDT — TRC20', type: 'CRYPTO', details: { address: 'TYXk6MdKCRNcj84sDtTVe1rwdqJStQWfVB', network: 'TRC20' }, isActive: true, displayOrder: 4 }
        ];
        for (const m of defaultMethods) {
          await db.insert(paymentMethods).values(m);
        }
        methods = await db.query.paymentMethods.findMany({
          where: (paymentMethods, { eq }) => eq(paymentMethods.isActive, true),
          orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
        });
      }
      
      return methods;
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      return [];
    }
  }`;

if (code.includes('async getActivePaymentMethods() {')) {
  code = code.replace(oldMethod, newMethod);
  fs.writeFileSync('src/backend/services/walletService.ts', code);
}
