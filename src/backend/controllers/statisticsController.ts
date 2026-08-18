import { hasDatabase } from '../../db/index';
import { Request, Response } from 'express';
import { statisticsService } from '../services/statisticsService';

export class StatisticsController {
  async getLeaderboard(req: Request, res: Response) {
    try {
      if (!hasDatabase()) {
        return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured' } });
      }

      const period = (req.query.period as string) || 'all_time';
      const sortBy = (req.query.sortBy as string) || 'earnings';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await statisticsService.getLeaderboard(period, sortBy, page, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured' } });
      }
      res.status(500).json({ success: false, data: null, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  }

  async getMyStatistics(req: Request, res: Response) {
    try {
      if (!hasDatabase()) {
        return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured' } });
      }

      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      const data = await statisticsService.getUserStatistics(userId);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured' } });
      }
      res.status(500).json({ success: false, data: null, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  }
}

export const statisticsController = new StatisticsController();
