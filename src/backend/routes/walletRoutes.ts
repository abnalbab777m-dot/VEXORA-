import { Router } from 'express';
import { walletController } from '../controllers/walletController';
import { financialLimiter } from '../middlewares/rateLimitMiddleware';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, walletController.getWallet);
router.get('/payment-methods', requireAuth, walletController.getPaymentMethods);
router.get('/transactions', requireAuth, walletController.getTransactions);
router.post('/deposit', requireAuth, financialLimiter, walletController.deposit);
router.post('/withdraw', requireAuth, financialLimiter, walletController.withdraw);

export default router;
