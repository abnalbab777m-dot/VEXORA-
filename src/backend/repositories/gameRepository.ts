import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { games } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

export class GameRepository {
  async findAll() {
    if (!hasDatabase()) return [];
    return db.select().from(games);
  }

  async findActive() {
    if (!hasDatabase()) return [];
    return db.select().from(games).where(eq(games.status, 'ACTIVE'));
  }

  async findById(id: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
    return result[0] || null;
  }

  async findBySlug(slug: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
    return result[0] || null;
  }
}

export const gameRepository = new GameRepository();
