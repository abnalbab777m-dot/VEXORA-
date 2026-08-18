import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { matchmakingQueue } from '../../db/schema';
import { eq, and, asc, sql, ne } from 'drizzle-orm';

export class MatchmakingRepository {
  async create(data: typeof matchmakingQueue.$inferInsert, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.insert(matchmakingQueue).values(data).returning();
    return result[0];
  }

  async findActiveByUserId(userId: string, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.userId, userId),
        eq(matchmakingQueue.status, 'WAITING')
      ))
      .limit(1);
    return result[0] || null;
  }

  async findActiveByUserIdForUpdate(userId: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.userId, userId),
        eq(matchmakingQueue.status, 'WAITING')
      ))
      .for('update')
      .limit(1);
    return result[0] || null;
  }

  async findOldestCompatible(gameId: string, stakeId: string, excludeUserId: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.gameId, gameId),
        eq(matchmakingQueue.stakeId, stakeId),
        eq(matchmakingQueue.status, 'WAITING'),
        ne(matchmakingQueue.userId, excludeUserId)
      ))
      .orderBy(asc(matchmakingQueue.createdAt))
      .for('update')
      .limit(1);
    return result[0] || null;
  }

  async findOpenLobbies(excludeUserId: string) {
    if (!hasDatabase()) return [];
    return await db.select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.status, 'WAITING'),
        ne(matchmakingQueue.userId, excludeUserId)
      ))
      .orderBy(asc(matchmakingQueue.createdAt));
  }

  async updateStatus(id: string, status: string, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.update(matchmakingQueue)
      .set({ status, matchedAt: status === 'MATCHED' ? new Date() : undefined })
      .where(eq(matchmakingQueue.id, id))
      .returning();
    return result[0] || null;
  }
}

export const matchmakingRepository = new MatchmakingRepository();
