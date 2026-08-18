import { Router } from 'express';
import { adminDisputeController } from '../controllers/adminDisputeController';
import { adminController } from '../controllers/adminController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Apply requireAdmin to all routes in this router
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.post('/test-telegram', adminController.testTelegramNotification);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Matches
router.get('/matches', adminController.getMatches);
router.get('/matches/:id', adminController.getMatchDetail);

// Transactions
router.get('/transactions', adminController.getTransactions);

// Games
router.get('/games', adminController.getGames);
router.patch('/games/:id', adminController.updateGame);

// Disputes
router.get('/disputes', adminDisputeController.getAllDisputes);
router.get('/disputes/:id', adminDisputeController.getDisputeById);
router.post('/disputes/:id/resolve', adminDisputeController.resolveDispute);


// Payment Methods
router.get('/payment-methods', adminController.getPaymentMethods);
router.post('/payment-methods', adminController.createPaymentMethod);
router.put('/payment-methods/:id', adminController.updatePaymentMethod);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

router.post('/stakes', adminController.addStake);
router.post('/stakes/:id/toggle', adminController.toggleStakeStatus);

router.post('/transactions/:id/approve', adminController.approveTransaction);
router.post('/transactions/:id/reject', adminController.rejectTransaction);
router.post('/users/:userId/balance', adminController.adjustBalance);
export default router;

