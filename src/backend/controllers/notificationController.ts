import { Request, Response } from 'express';
import { db } from '../../db';
import { notifications } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export class NotificationController {
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const data = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit: 50,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const notificationController = new NotificationController();
