import { Request, Response } from 'express';
import { gameService } from '../services/gameService';

export class GameController {
  async getGames(req: Request, res: Response) {
    try {
      const games = await gameService.getActiveGames();
      res.json({ success: true, data: games });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'GAMES_ERROR', message: error.message } });
    }
  }

  async getGame(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const game = await gameService.getGameById(id);
      res.json({ success: true, data: game });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(404).json({ success: false, data: null, error: { code: 'GAME_NOT_FOUND', message: error.message } });
    }
  }

  async getGameStakes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stakes = await gameService.getAvailableStakes(id);
      res.json({ success: true, data: stakes });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(404).json({ success: false, data: null, error: { code: 'STAKES_ERROR', message: error.message } });
    }
  }
}

export const gameController = new GameController();
