import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { wallets } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class WalletRepository {
  async findByUserId(userId: string, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    return result[0] || null;
  }

  async findByUserIdForUpdate(userId: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select().from(wallets).where(eq(wallets.userId, userId)).for('update').limit(1);
    return result[0] || null;
  }

  async create(userId: string, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.insert(wallets).values({ userId }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<typeof wallets.$inferInsert>, tx?: any) {
    if (!hasDatabase()) return null;
    data.updatedAt = new Date();
    const q = tx || db;
    const result = await q.update(wallets).set(data).where(eq(wallets.id, id)).returning();
    return result[0] || null;
  }
}

export const walletRepository = new WalletRepository();
