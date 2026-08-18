import { hasDatabase, db } from '../../db/index';
import { paymentMethods, gameStakes } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { walletService } from '../services/walletService';
import { Request, Response } from 'express';
import { adminService } from '../services/adminService';

export class AdminController {
  async getPaymentMethods(req: Request, res: Response) {
    try {
      if (!hasDatabase()) return res.json({ success: true, data: [] });
      const { db } = await import('../../db/index');
      const { paymentMethods } = await import('../../db/schema');
      let methods = await db.query.paymentMethods.findMany({
        orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
      });
      
      if (methods.length === 0) {
        // Just call wallet service to seed them if empty
        const { walletService } = await import('../services/walletService');
        await walletService.getActivePaymentMethods();
        methods = await db.query.paymentMethods.findMany({
          orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
        });
      }
      
      res.json({ success: true, data: methods });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async createPaymentMethod(req: Request, res: Response) {
    try {
      if (!hasDatabase()) return res.json({ success: true });
      const data = req.body;
      const result = await db.insert(paymentMethods).values(data).returning();
      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async updatePaymentMethod(req: Request, res: Response) {
    try {
      if (!hasDatabase()) return res.json({ success: true });
      const { id } = req.params;
      const data = req.body;
      const result = await db.update(paymentMethods).set({ ...data, updatedAt: new Date() }).where(eq(paymentMethods.id, id)).returning();
      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  
  private handleErr(res: Response, error: any) {
    if (error.message === 'DATABASE_NOT_CONFIGURED') {
      return res.status(400).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured' } });
    }
    if (error.message === 'USER_NOT_FOUND' || error.message === 'MATCH_NOT_FOUND') {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: error.message } });
    }
    if (error.message === 'CANNOT_MODIFY_SELF_STATUS') {
      return res.status(400).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Cannot modify own status' } });
    }
    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ success: false, data: null, error: { code: 'INVALID_STATUS', message: 'Invalid status value' } });
    }
    res.status(500).json({ success: false, data: null, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }

  testTelegramNotification = async (req: Request, res: Response) => {
    try {
      const { telegramService } = await import('../services/telegramService');
      const data = await telegramService.sendMessage("🔔 اختبار ناجح: بوت نكسورا متصل بلوحة التحكم بنجاح");
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, data: null, error: { code: 'TELEGRAM_ERROR', message: error.message } });
    }
  }

  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getUsers = async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string || '';
      const status = req.query.status as string || 'ALL';
      const role = req.query.role as string || 'ALL';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await adminService.getUsers(search, status, role, page, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getUserDetail = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const data = await adminService.getUserDetail(userId);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  updateUserStatus = async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user?.userId;
      const userId = req.params.id;
      const { status } = req.body;
      const data = await adminService.updateUserStatus(adminId, userId, status);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getMatches = async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string || '';
      const status = req.query.status as string || 'ALL';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await adminService.getMatches(search, status, page, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getMatchDetail = async (req: Request, res: Response) => {
    try {
      const matchId = req.params.id;
      const data = await adminService.getMatchDetail(matchId);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getTransactions = async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string || '';
      const type = req.query.type as string || 'ALL';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await adminService.getTransactions(search, type, startDate, endDate, page, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getGames = async (req: Request, res: Response) => {
    try {
      const data = await adminService.getGames();
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  updateGame = async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user?.userId;
      const gameId = req.params.id;
      const data = await adminService.updateGame(adminId, gameId, req.body);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  getAuditLogs = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await adminService.getAuditLogs(page, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      this.handleErr(res, error);
    }
  }

  async addStake(req: Request, res: Response) {
    try {
      const { gameId, amount } = req.body;
      if (!gameId || !amount) {
        return res.status(400).json({ success: false, error: 'gameId and amount required' });
      }
      
      const { db } = await import('../../../src/db');
      const { gameStakes } = await import('../../../src/db/schema');
      const { eq, and } = await import('drizzle-orm');

      const existing = await db.select().from(gameStakes).where(and(eq(gameStakes.gameId, gameId), eq(gameStakes.amount, amount))).limit(1).then(r => r[0]);
      if (existing) {
        await db.update(gameStakes).set({ status: 'ACTIVE' }).where(eq(gameStakes.id, existing.id));
      } else {
        await db.insert(gameStakes).values({
          gameId,
          amount,
          currency: 'USD',
          status: 'ACTIVE'
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to add stake' });
    }
  }

  async toggleStakeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db } = await import('../../../src/db');
      const { gameStakes } = await import('../../../src/db/schema');
      const { eq } = await import('drizzle-orm');

      const existing = await db.select().from(gameStakes).where(eq(gameStakes.id, id)).limit(1).then(r => r[0]);
      if (existing) {
        const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await db.update(gameStakes).set({ status: newStatus }).where(eq(gameStakes.id, id));
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to toggle stake' });
    }
  }
  async approveTransaction(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.userId;
      const { id } = req.params;
      await walletService.approveTransaction(id, adminId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async rejectTransaction(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.userId;
      const { id } = req.params;
      const { reason } = req.body;
      await walletService.rejectTransaction(id, adminId, reason || 'Rejected by admin');
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async adjustBalance(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.userId;
      const { userId } = req.params;
      const { type, amount, reason } = req.body;
      const result = await walletService.adminAdjustBalance(userId, adminId, type, amount.toString(), reason || 'Admin adjustment');
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

}
export const adminController = new AdminController();
