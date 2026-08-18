import { Request, Response } from 'express';
import { matchmakingService } from '../services/matchmakingService';
import { z } from 'zod';

const joinSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  stakeId: z.string().min(1, "Stake ID is required"),
  region: z.string().optional()
});

export class MatchmakingController {
  async join(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const validated = joinSchema.parse(req.body);
      
      const result = await matchmakingService.join(userId, validated.gameId, validated.stakeId, validated.region);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'MATCHMAKING_ERROR', message: error.message } });
    }
  }

  async quickJoin(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const result = await matchmakingService.quickJoin(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'MATCHMAKING_ERROR', message: error.message } });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const result = await matchmakingService.cancel(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'MATCHMAKING_ERROR', message: error.message } });
    }
  }

  async status(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const status = await matchmakingService.getStatus(userId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'MATCHMAKING_ERROR', message: error.message } });
    }
  }
}

export const matchmakingController = new MatchmakingController();
