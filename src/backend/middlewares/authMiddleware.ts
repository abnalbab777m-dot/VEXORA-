import { hasDatabase } from '../../db/index';
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }

  try {
    if (hasDatabase()) {
      const user = await userRepository.findById((payload as any).userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'User no longer exists' },
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: `Account is ${user.status.toLowerCase()}` },
      });
    }
    
    // Update payload with fresh role just in case
    (payload as any).role = user.role;
  }

    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication error' },
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    const role = (req as any).user?.role;
    if (role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'ADMIN_REQUIRED', message: 'Administrator access required' },
      });
    }
    next();
  });
};

