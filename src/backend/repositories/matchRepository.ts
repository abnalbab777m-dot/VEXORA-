import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { matches } from '../../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export class MatchRepository {
  async create(data: typeof matches.$inferInsert, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.insert(matches).values(data).returning();
    return result[0];
  }

  async findActiveByUserId(userId: string, tx?: any) {
    if (!hasDatabase()) return null;
    // Active means PENDING, READY, LIVE, RESULT_SUBMITTED, UNDER_REVIEW, DISPUTED
    const q = tx || db;
    const result = await q.select()
      .from(matches)
      .where(and(
        or(
          eq(matches.player1Id, userId),
          eq(matches.player2Id, userId)
        ),
        or(
          eq(matches.status, 'PENDING'),
          eq(matches.status, 'READY'),
          eq(matches.status, 'LIVE'),
          eq(matches.status, 'RESULT_SUBMITTED'),
          eq(matches.status, 'UNDER_REVIEW'),
          eq(matches.status, 'DISPUTED')
        )
      ))
      .limit(1);
    return result[0] || null;
  }

  async findByUserId(userId: string) {
    if (!hasDatabase()) return [];
    return await db.select()
      .from(matches)
      .where(or(eq(matches.player1Id, userId), eq(matches.player2Id, userId)))
      .orderBy(desc(matches.createdAt));
  }

  async findById(id: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
    return result[0] || null;
  }

  async findByIdForUpdate(id: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select().from(matches).where(eq(matches.id, id)).limit(1).for('update');
    return result[0] || null;
  }

  async update(id: string, data: Partial<typeof matches.$inferInsert>, tx?: any) {
    if (!hasDatabase()) return null;
    const dbContext = tx || db;
    const result = await dbContext.update(matches).set(data).where(eq(matches.id, id)).returning();
    return result[0] || null;
  }
}

export const matchRepository = new MatchRepository();
