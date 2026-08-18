import { Router } from 'express';
import { gameInvitationController } from '../controllers/gameInvitationController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);
router.post('/', gameInvitationController.invite);
router.post('/:id/respond', gameInvitationController.respond);

export default router;
