import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  efootballUsername: z.string().min(1, 'eFootball username cannot be empty').optional(),
  jawakerUsername: z.string().min(1, 'Jawaker username cannot be empty').optional(),
  gameUsername: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export class UserController {
  async updateMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await userService.updateProfile(userId, validatedData, req.ip);

      res.json({ success: true, data: updatedUser });
    } catch (error: any) {
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
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update profile' },
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      }

      const validatedData = changePasswordSchema.parse(req.body);
      await userService.changePassword(userId, validatedData.currentPassword, validatedData.newPassword, req.ip);

      // Invalidate current session (logout)
      res.clearCookie('token');
      res.json({ success: true, data: { message: 'Password changed successfully. Please login again.' } });
    } catch (error: any) {
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
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to change password' },
      });
    }
  }
}

export const userController = new UserController();

