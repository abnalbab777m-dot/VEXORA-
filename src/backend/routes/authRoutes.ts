import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimitMiddleware';
import { requireAuth } from '../middlewares/authMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per IP
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many login attempts. Try again later.' } },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per IP per hour
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many accounts created from this IP.' } },
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
