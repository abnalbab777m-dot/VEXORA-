import { Router } from 'express';
import { statisticsController } from '../controllers/statisticsController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/leaderboard', statisticsController.getLeaderboard);
router.get('/statistics/me', requireAuth, statisticsController.getMyStatistics);

export default router;
