import re

with open('src/backend/controllers/adminController.ts', 'r') as f:
    c = f.read()

admin_wallet_methods = """
  async approveTransaction(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.userId;
      const { id } = req.params;
      await walletService.approveTransaction(id, adminId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async rejectTransaction(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.userId;
      const { id } = req.params;
      const { reason } = req.body;
      await walletService.rejectTransaction(id, adminId, reason || 'Rejected by admin');
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async adjustBalance(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.userId;
      const { userId } = req.params;
      const { type, amount, reason } = req.body;
      const result = await walletService.adminAdjustBalance(userId, adminId, type, amount.toString(), reason || 'Admin adjustment');
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
"""

c = c.replace("export const adminController = new AdminController();", admin_wallet_methods + "\nexport const adminController = new AdminController();")

if "import { walletService }" not in c:
    c = "import { walletService } from '../services/walletService';\n" + c

with open('src/backend/controllers/adminController.ts', 'w') as f:
    f.write(c)

with open('src/backend/routes/adminRoutes.ts', 'r') as f:
    routes = f.read()

new_routes = """
router.post('/transactions/:id/approve', adminController.approveTransaction);
router.post('/transactions/:id/reject', adminController.rejectTransaction);
router.post('/users/:userId/balance', adminController.adjustBalance);
export default router;
"""

routes = routes.replace("export default router;", new_routes)

with open('src/backend/routes/adminRoutes.ts', 'w') as f:
    f.write(routes)
