import { Request, Response } from 'express';
import { settlementService } from '../services/settlementService';

export class SettlementController {
  async settleMatch(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      }

      const { id } = req.params;

      const result = await settlementService.settleMatch(id, userId);
      res.json({ success: true, data: result });
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
      if (error.message === 'UNAUTHORIZED_USER') {
        return res.status(403).json({ success: false, data: null, error: { code: 'UNAUTHORIZED_USER', message: 'Not authorized for this match' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'SETTLEMENT_ERROR', message: error.message } });
    }
  }
}

export const settlementController = new SettlementController();
