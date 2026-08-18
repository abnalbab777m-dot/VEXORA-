import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { gameStakes } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class GameStakeRepository {
  async findByGameId(gameId: string) {
    if (!hasDatabase()) return [];
    return db.select().from(gameStakes).where(eq(gameStakes.gameId, gameId));
  }

  async findActiveByGameId(gameId: string) {
    if (!hasDatabase()) return [];
    return db.select().from(gameStakes).where(
      and(
        eq(gameStakes.gameId, gameId),
        eq(gameStakes.status, 'ACTIVE')
      )
    );
  }

  async findById(id: string) {
    if (!hasDatabase()) return null;
    const result = await db.select().from(gameStakes).where(eq(gameStakes.id, id)).limit(1);
    return result[0] || null;
  }
}

export const gameStakeRepository = new GameStakeRepository();
