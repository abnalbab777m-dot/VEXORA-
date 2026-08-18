import { Router } from 'express';
import { matchmakingController } from '../controllers/matchmakingController';
import { financialLimiter } from '../middlewares/rateLimitMiddleware';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/join', requireAuth, financialLimiter, matchmakingController.join);
router.post('/quick-join', requireAuth, financialLimiter, matchmakingController.quickJoin);
router.delete('/cancel', requireAuth, matchmakingController.cancel);
router.get('/status', requireAuth, matchmakingController.status);

export default router;
