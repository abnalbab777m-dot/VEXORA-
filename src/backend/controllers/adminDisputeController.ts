import { Request, Response } from 'express';
import { adminDisputeService } from '../services/adminDisputeService';

export class AdminDisputeController {
  async getAllDisputes(req: Request, res: Response) {
    try {
      // Authorization is handled by requireAdmin middleware
      const disputes = await adminDisputeService.getAllDisputes();
      res.json({ success: true, data: disputes });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  async getDisputeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dispute = await adminDisputeService.getDisputeById(id);
      
      if (!dispute) {
        return res.status(404).json({ success: false, data: null, error: { code: 'DISPUTE_NOT_FOUND', message: 'Dispute not found' } });
      }
      
      res.json({ success: true, data: dispute });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  async resolveDispute(req: Request, res: Response) {
    try {
      const adminUserId = (req as any).user?.userId;
      const { id } = req.params;
      const { resolution } = req.body;
      
      if (!resolution) {
        return res.status(400).json({ success: false, data: null, error: { code: 'INVALID_RESOLUTION', message: 'Resolution is required' } });
      }

      const result = await adminDisputeService.resolveDispute(id, resolution, adminUserId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error.message === 'DISPUTE_NOT_FOUND') {
        return res.status(404).json({ success: false, data: null, error: { code: 'DISPUTE_NOT_FOUND', message: 'Dispute not found' } });
      }
      if (error.message === 'DISPUTE_ALREADY_RESOLVED') {
        return res.status(400).json({ success: false, data: null, error: { code: 'DISPUTE_ALREADY_RESOLVED', message: 'Dispute already resolved' } });
      }
      if (error.message === 'INVALID_RESOLUTION') {
        return res.status(400).json({ success: false, data: null, error: { code: 'INVALID_RESOLUTION', message: 'Invalid resolution' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'RESOLUTION_ERROR', message: error.message } });
    }
  }
}

export const adminDisputeController = new AdminDisputeController();
