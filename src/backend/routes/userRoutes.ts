import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth } from '../middlewares/authMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many attempts. Try again later.' } },
});

// /api/users/me maps to me, patch maps to updateMe
router.patch('/me', requireAuth, userController.updateMe);
router.post('/me/change-password', requireAuth, changePasswordLimiter, userController.changePassword);

router.get('/me', requireAuth, (req, res) => {
    // We already have a get me in auth routes, but let's keep it here too for consistency, redirecting to auth controller logic would work, or just copy the logic.
    // The instructions say GET /api/users/me, we can just proxy to auth controller's me or import the logic.
    // To avoid circular dependency or messy code, let's just do it directly.
    import('../controllers/authController').then(m => m.authController.me(req, res));
});

export default router;

