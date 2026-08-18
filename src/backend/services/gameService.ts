import { hasDatabase } from '../../db/index';
import { gameRepository } from '../repositories/gameRepository';
import { gameStakeRepository } from '../repositories/gameStakeRepository';

export class GameService {
  async getActiveGames() {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }
    const games = await gameRepository.findActive();
    const result = [];
    for (const game of games) {
        const stakes = await gameStakeRepository.findActiveByGameId(game.id);
        result.push({ ...game, stakes });
    }
    return result;
  }

  async getGameById(id: string) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }
    const game = await gameRepository.findById(id);
    if (!game) throw new Error('Game not found');
    return game;
  }

  async getGameBySlug(slug: string) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }
    const game = await gameRepository.findBySlug(slug);
    if (!game) throw new Error('Game not found');
    return game;
  }

  async getAvailableStakes(gameId: string) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured');
    }
    // Verify game exists and is active
    const game = await gameRepository.findById(gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'ACTIVE') throw new Error('Game is not currently active');

    return await gameStakeRepository.findActiveByGameId(gameId);
  }

  async isGameAvailable(gameId: string) {
    if (!hasDatabase()) return false;
    const game = await gameRepository.findById(gameId);
    return game !== null && game.status === 'ACTIVE' && game.isMatchmakingEnabled;
  }

  async isStakeAvailable(stakeId: string) {
     if (!hasDatabase()) return false;
     const stake = await gameStakeRepository.findById(stakeId);
     return stake !== null && stake.status === 'ACTIVE';
  }
}

export const gameService = new GameService();
