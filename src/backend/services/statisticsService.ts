import { hasDatabase } from '../../db/index';
import { statisticsRepository } from '../repositories/statisticsRepository';

export class StatisticsService {
  async getLeaderboard(period: string = 'all_time', sortBy: string = 'earnings', page: number = 1, limit: number = 20) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const validPeriods = ['daily', 'weekly', 'monthly', 'all_time'];
    const validSorts = ['earnings', 'wins', 'matches', 'win_rate'];
    
    if (!validPeriods.includes(period)) period = 'all_time';
    if (!validSorts.includes(sortBy)) sortBy = 'earnings';
    
    const maxLimit = 100;
    const safeLimit = Math.min(Math.max(1, limit), maxLimit);
    const offset = (Math.max(1, page) - 1) * safeLimit;
    
    return await statisticsRepository.getLeaderboard(period, sortBy, safeLimit, offset);
  }

  async getUserStatistics(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const stats = await statisticsRepository.getUserStatistics(userId);
    if (!stats) {
      return {
        wins: 0,
        losses: 0,
        totalMatches: 0,
        earnings: "0.00",
        winRate: 0,
        rank: 0
      };
    }
    
    return stats;
  }
}

export const statisticsService = new StatisticsService();
