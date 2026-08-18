import { hasDatabase } from '../../db/index';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { settlements } from '../../db/schema';

export class SettlementRepository {
  async findByMatchId(matchId: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(settlements).where(eq(settlements.matchId, matchId)).limit(1);
    return result[0] || null;
  }

  async findByMatchIdForUpdate(matchId: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select().from(settlements).where(eq(settlements.matchId, matchId)).limit(1).for('update');
    return result[0] || null;
  }

  async create(data: typeof settlements.$inferInsert, tx?: any) {
    if (!hasDatabase()) return null;
    const dbContext = tx || db;
    const result = await dbContext.insert(settlements).values(data).returning();
    return result[0];
  }

  async updateStatus(id: string, status: string, tx?: any) {
    if (!hasDatabase()) return null;
    const dbContext = tx || db;
    const result = await dbContext.update(settlements).set({ status }).where(eq(settlements.id, id)).returning();
    return result[0];
  }

  async markCompleted(id: string, tx?: any) {
    if (!hasDatabase()) return null;
    const dbContext = tx || db;
    const result = await dbContext.update(settlements).set({ 
      status: 'COMPLETED',
      completedAt: new Date()
    }).where(eq(settlements.id, id)).returning();
    return result[0];
  }
}

export const settlementRepository = new SettlementRepository();
