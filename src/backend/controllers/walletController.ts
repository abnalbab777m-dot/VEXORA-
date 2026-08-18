import { Request, Response } from 'express';
import { walletService } from '../services/walletService';
import { z } from 'zod';

const depositSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
  senderName: z.string().optional(),
  transactionHash: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
  paymentMethodName: z.string().optional(),
  paymentMethodType: z.string().optional(),
  withdrawalDetails: z.any().optional(),
});

export class WalletController {
  async getPaymentMethods(req: Request, res: Response) {
    try {
      const methods = await walletService.getActivePaymentMethods();
      res.json({ success: true, data: methods });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'WALLET_ERROR', message: error.message } });
    }
  }

  async getWallet(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const wallet = await walletService.getWallet(userId);
      res.json({ success: true, data: wallet });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'WALLET_ERROR', message: error.message } });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const transactions = await walletService.getTransactions(userId);
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'WALLET_ERROR', message: error.message } });
    }
  }

  async deposit(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const validatedData = depositSchema.parse(req.body);
      if (Number(validatedData.amount) < 5) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Minimum deposit is 5 USD' } });
      }
      const transaction = await walletService.createDepositRequest(userId, validatedData.amount, validatedData.idempotencyKey, { 
        paymentMethodId: validatedData.paymentMethodId,
        senderName: validatedData.senderName,
        transactionHash: validatedData.transactionHash
      });
      
      res.json({ success: true, data: transaction });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'WALLET_ERROR', message: error.message } });
    }
  }

  async withdraw(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const validatedData = withdrawSchema.parse(req.body);
      if (Number(validatedData.amount) < 10) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Minimum withdrawal is 10 USD' } });
      }
      const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey, {
        paymentMethodId: validatedData.paymentMethodId,
        paymentMethodName: validatedData.paymentMethodName,
        paymentMethodType: validatedData.paymentMethodType,
        withdrawalDetails: validatedData.withdrawalDetails
      });
      
      res.json({ success: true, data: transaction });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
      }
      res.status(400).json({ success: false, data: null, error: { code: 'WALLET_ERROR', message: error.message } });
    }
  }
}

export const walletController = new WalletController();
