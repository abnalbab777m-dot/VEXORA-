import { Request, Response } from 'express';
import { gameInvitationService } from '../services/gameInvitationService';

export class GameInvitationController {
  async invite(req: Request, res: Response) {
    try {
      const senderId = (req as any).user.userId;
      const { receiverId, gameId, stakeId } = req.body;
      const invite = await gameInvitationService.inviteFriend(senderId, receiverId, gameId, stakeId);
      res.json({ success: true, data: invite });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async respond(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const { accept } = req.body;
      const result = await gameInvitationService.respondToInvite(userId, id, accept);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const gameInvitationController = new GameInvitationController();
