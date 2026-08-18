import { Request, Response } from 'express';
import { matchResultService } from '../services/matchResultService';
import { z } from 'zod';


const submitResultSchema = z.object({
  winnerId: z.string().min(1),
  score: z.string().min(1).max(20),
  evidenceUrl: z.string().url().max(2048).optional().or(z.literal(''))
});

export class MatchResultController {
  async submitResult(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const { id } = req.params;
      const { winnerId, score, evidenceUrl } = submitResultSchema.parse(req.body);

      const result = await matchResultService.submitResult(id, userId, winnerId, score, evidenceUrl);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      if (error.message === 'MATCH_NOT_FOUND') {
        return res.status(404).json({ success: false, data: null, error: { code: 'MATCH_NOT_FOUND', message: 'Match not found' } });
      }
      if (error.message === 'MATCH_ACCESS_DENIED') {
        return res.status(403).json({ success: false, data: null, error: { code: 'MATCH_ACCESS_DENIED', message: 'Access denied to this match' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'RESULT_ERROR', message: error.message } });
    }
  }

  async confirmResult(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const { id } = req.params;
      const result = await matchResultService.confirmResult(id, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      if (error.message === 'MATCH_NOT_FOUND') {
        return res.status(404).json({ success: false, data: null, error: { code: 'MATCH_NOT_FOUND', message: 'Match not found' } });
      }
      if (error.message === 'MATCH_ACCESS_DENIED') {
        return res.status(403).json({ success: false, data: null, error: { code: 'MATCH_ACCESS_DENIED', message: 'Access denied to this match' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'RESULT_ERROR', message: error.message } });
    }
  }

  async disputeResult(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const { id } = req.params;
      const result = await matchResultService.disputeResult(id, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      if (error.message === 'MATCH_NOT_FOUND') {
        return res.status(404).json({ success: false, data: null, error: { code: 'MATCH_NOT_FOUND', message: 'Match not found' } });
      }
      if (error.message === 'MATCH_ACCESS_DENIED') {
        return res.status(403).json({ success: false, data: null, error: { code: 'MATCH_ACCESS_DENIED', message: 'Access denied to this match' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'RESULT_ERROR', message: error.message } });
    }
  }

  async getResult(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const { id } = req.params;
      const result = await matchResultService.getResult(id, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      if (error.message === 'MATCH_NOT_FOUND') {
        return res.status(404).json({ success: false, data: null, error: { code: 'MATCH_NOT_FOUND', message: 'Match not found' } });
      }
      if (error.message === 'MATCH_ACCESS_DENIED') {
        return res.status(403).json({ success: false, data: null, error: { code: 'MATCH_ACCESS_DENIED', message: 'Access denied to this match' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'RESULT_ERROR', message: error.message } });
    }
  }
}

export const matchResultController = new MatchResultController();
