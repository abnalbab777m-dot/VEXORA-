import { Request, Response } from 'express';
import { matchService } from '../services/matchService';

export class MatchController {
  async getUserMatches(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const matches = await matchService.getUserMatches(userId);
      res.json({ success: true, data: matches });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database is not configured' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'MATCH_ERROR', message: error.message } });
    }
  }

  async getMatchById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const { id } = req.params;
      const match = await matchService.getMatchById(id, userId);
      res.json({ success: true, data: match });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database is not configured' } });
      }
      if (error.message === 'MATCH_NOT_FOUND') {
        return res.status(404).json({ success: false, data: null, error: { code: 'MATCH_NOT_FOUND', message: 'Match not found' } });
      }
      if (error.message === 'MATCH_ACCESS_DENIED') {
        return res.status(403).json({ success: false, data: null, error: { code: 'MATCH_ACCESS_DENIED', message: 'Access denied to this match' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'MATCH_ERROR', message: error.message } });
    }
  }
}

export const matchController = new MatchController();
