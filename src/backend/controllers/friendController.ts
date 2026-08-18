import { Request, Response } from 'express';
import { friendService } from '../services/friendService';

export class FriendController {
  async getFriends(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const friends = await friendService.getFriends(userId);
      res.json({ success: true, data: friends });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getPendingRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const requests = await friendService.getPendingRequests(userId);
      res.json({ success: true, data: requests });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async sendRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { username } = req.body;
      await friendService.sendRequest(userId, username);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async respondToRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { senderId, accept } = req.body;
      await friendService.respondToRequest(userId, senderId, accept);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async removeFriend(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { friendId } = req.params;
      await friendService.removeFriend(userId, friendId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const friendController = new FriendController();
