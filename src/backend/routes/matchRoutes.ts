import { Router } from 'express';
import { matchController } from '../controllers/matchController';
import { matchResultController } from '../controllers/matchResultController';
import { financialLimiter } from '../middlewares/rateLimitMiddleware';
import { settlementController } from '../controllers/settlementController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, matchController.getUserMatches);
router.get('/:id', requireAuth, matchController.getMatchById);
router.post('/:id/room-code', requireAuth, matchController.setRoomCode);
router.post('/:id/switch-host', requireAuth, matchController.switchHost);

// Result workflows
router.post('/:id/result', requireAuth, financialLimiter, matchResultController.submitResult);
router.post('/:id/confirm', requireAuth, financialLimiter, matchResultController.confirmResult);
router.post('/:id/dispute', requireAuth, financialLimiter, matchResultController.disputeResult);
router.get('/:id/result', requireAuth, matchResultController.getResult);

// Settlement
router.post('/:id/settle', requireAuth, settlementController.settleMatch);

export default router;
