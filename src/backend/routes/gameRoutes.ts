import { Router } from 'express';
import { gameController } from '../controllers/gameController';

const router = Router();

router.get('/', gameController.getGames);
router.get('/:id', gameController.getGame);
router.get('/:id/stakes', gameController.getGameStakes);

export default router;
