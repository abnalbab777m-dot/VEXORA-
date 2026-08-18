import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { disputes } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export class DisputeRepository {
  async create(data: typeof disputes.$inferInsert, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.insert(disputes).values(data).returning();
    return result[0];
  }

  async findByMatchId(matchId: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(disputes).where(eq(disputes.matchId, matchId)).limit(1);
    return result[0] || null;
  }

  async findByMatchIdForUpdate(matchId: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select().from(disputes).where(eq(disputes.matchId, matchId)).limit(1).for('update');
    return result[0] || null;
  }

  async findById(id: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    return result[0] || null;
  }

  async findByIdForUpdate(id: string, tx: any) {
    if (!hasDatabase()) return null;
    const result = await tx.select().from(disputes).where(eq(disputes.id, id)).limit(1).for('update');
    return result[0] || null;
  }

  async findAll() {
    if (!hasDatabase()) return [];
    return await db.select().from(disputes).orderBy(desc(disputes.createdAt));
  }

  async update(id: string, data: Partial<typeof disputes.$inferInsert>, tx?: any) {
    if (!hasDatabase()) return null;
    const q = tx || db;
    const result = await q.update(disputes).set(data).where(eq(disputes.id, id)).returning();
    return result[0] || null;
  }
}

export const disputeRepository = new DisputeRepository();
