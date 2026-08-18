import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { matchResults } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class MatchResultRepository {
  async create(data: typeof matchResults.$inferInsert, tx?: any) {
    if (!hasDatabase()) return null;
    const dbContext = tx || db;
    const result = await dbContext.insert(matchResults).values(data).returning();
    return result[0] || null;
  }

  async update(id: string, data: Partial<typeof matchResults.$inferInsert>, tx?: any) {
    if (!hasDatabase()) return null;
    const dbContext = tx || db;
    data.updatedAt = new Date();
    const result = await dbContext.update(matchResults).set(data).where(eq(matchResults.id, id)).returning();
    return result[0] || null;
  }

  async findByMatchId(matchId: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(matchResults).where(eq(matchResults.matchId, matchId)).limit(1);
    return result[0] || null;
  }

  async findByMatchIdForUpdate(matchId: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select().from(matchResults).where(eq(matchResults.matchId, matchId)).limit(1).for('update');
    return result[0] || null;
  }
}

export const matchResultRepository = new MatchResultRepository();
