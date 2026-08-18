const fs = require('fs');

let content = fs.readFileSync('src/backend/services/walletService.ts', 'utf8');

// The pattern is:
// const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId or idempotencyKey, tx);
// if (existing) return existing;
// let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
// ...

const replacements = [
  {
    search: `      const existing = await walletTransactionRepository.findByIdempotencyKey(idempotencyKey, tx);\n      if (existing) return existing;\n\n      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) wallet = await walletRepository.create(userId, tx);`,
    replace: `      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) wallet = await walletRepository.create(userId, tx);\n\n      const existing = await walletTransactionRepository.findByIdempotencyKey(idempotencyKey, tx);\n      if (existing) return existing;`
  },
  {
    search: `      const existing = await walletTransactionRepository.findByIdempotencyKey(idempotencyKey, tx);\n      if (existing) return existing;\n\n      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) wallet = await walletRepository.create(userId, tx);`,
    replace: `      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) wallet = await walletRepository.create(userId, tx);\n\n      const existing = await walletTransactionRepository.findByIdempotencyKey(idempotencyKey, tx);\n      if (existing) return existing;`
  },
  {
    search: `      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n      if (existing) return existing;\n\n      const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) throw new Error('Wallet not found');`,
    replace: `      const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) throw new Error('Wallet not found');\n\n      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n      if (existing) return existing;`
  },
  {
    search: `      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n      if (existing) return existing;\n\n      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) wallet = await walletRepository.create(userId, tx); // Shouldn't happen but safe`,
    replace: `      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n      if (!wallet) wallet = await walletRepository.create(userId, tx); // Shouldn't happen but safe\n\n      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n      if (existing) return existing;`
  },
  {
    search: `       const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n       if (existing) return existing;\n\n       const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n       if (!wallet) throw new Error('Wallet not found');`,
    replace: `       const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n       if (!wallet) throw new Error('Wallet not found');\n\n       const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n       if (existing) return existing;`
  },
  {
    search: `       const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n       if (existing) return existing;\n\n        const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n       if (!wallet) throw new Error('Wallet not found');`,
    replace: `        const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);\n       if (!wallet) throw new Error('Wallet not found');\n\n       const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);\n       if (existing) return existing;`
  }
];

let newContent = content;
for (const r of replacements) {
    // Because spacing might be slightly off, we use a regex approach for all.
}

