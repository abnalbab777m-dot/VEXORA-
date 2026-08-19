import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  email: z.string().email('Valid email is required'),
  efootballUsername: z.string().min(1, 'eFootball username is mandatory'),
  jawakerUsername: z.string().min(1, 'Jawaker username is mandatory'),
  gameUsername: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, token } = await authService.register(validatedData);

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('[AuthController] Login Error:', error.message, 'Cause:', error.cause);
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: error.issues[0].message },
        });
      }
      res.status(400).json({
        success: false,
        data: null,
        error: { code: 'AUTH_ERROR', message: error.message || 'Registration failed' },
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await authService.login(validatedData);

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
       if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        });
      }
      res.status(401).json({
        success: false,
        data: null,
        error: { code: 'AUTH_ERROR', message: error.cause?.message || error.message || 'Login failed', cause: error.cause?.code || error.code || 'UNKNOWN', debug: { db: process.env.SQL_DB_NAME, host: process.env.SQL_HOST, dbUrlStr: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) : 'none' } },
      });
    }
  }

  async logout(req: Request, res: Response) {
    let userId = (req as any).user?.userId;
    if (!userId && req.cookies?.token) {
      const payload = authService.verifyToken(req.cookies.token);
      if (payload) {
        userId = (payload as any).userId;
      }
    }
    if (userId) {
      await auditLogRepository.log(userId, 'LOGOUT', undefined, req.ip);
    }
    res.clearCookie('token');
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  }

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      }

      const user = await userService.getUserById(userId);
      if (!user) {
         res.clearCookie('token');
         return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'User no longer exists' } });
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'DATABASE_NOT_CONFIGURED' || error.message.includes('Database is not configured')) {
        return res.status(503).json({ success: false, data: null, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database not configured. Running in Demo Mode.' } });
      }
      res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: 'Failed to fetch user' } });
    }
  }
}

export const authController = new AuthController();
