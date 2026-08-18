import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { walletTransactions } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export class WalletTransactionRepository {
  async findByWalletId(walletId: string) {
    if (!hasDatabase()) return [];
    return db.select().from(walletTransactions).where(eq(walletTransactions.walletId, walletId)).orderBy(desc(walletTransactions.createdAt));
  }

  async findByUserId(userId: string) {
    if (!hasDatabase()) return [];
    return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt));
  }

  async findByIdempotencyKey(referenceId: string, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.select().from(walletTransactions).where(eq(walletTransactions.referenceId, referenceId)).limit(1);
    return result[0] || null;
  }

  async create(data: typeof walletTransactions.$inferInsert, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.insert(walletTransactions).values(data).returning();
    return result[0];
  }
}

export const walletTransactionRepository = new WalletTransactionRepository();
