import { Router } from 'express';
import { friendController } from '../controllers/friendController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);
router.get('/', friendController.getFriends);
router.get('/requests', friendController.getPendingRequests);
router.post('/requests', friendController.sendRequest);
router.post('/requests/respond', friendController.respondToRequest);
router.delete('/:friendId', friendController.removeFriend);

export default router;
