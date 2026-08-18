import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

export class UserRepository {
  async findByEmailOrUsername(email: string, username: string) {
    if (!hasDatabase()) return null; // Graceful degradation
    const result = await db.select().from(users).where(
      or(eq(users.email, email), eq(users.username, username))
    ).limit(1);
    return result[0] || null;
  }

  async findByEmail(email: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findByUsername(username: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async findById(id: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: typeof users.$inferInsert) {
    if (!hasDatabase()) {
      return { ...data, id: 'mock-id-' + Date.now(), createdAt: new Date(), updatedAt: new Date() } as any;
    }
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    if (!hasDatabase()) return null;
    const result = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0] || null;
  }
}

export const userRepository = new UserRepository();
