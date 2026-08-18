import fs from 'fs';

let code = fs.readFileSync('src/backend/controllers/adminController.ts', 'utf8');

const oldMethod = `  async getPaymentMethods(req: Request, res: Response) {
    try {
      if (!hasDatabase()) return res.json({ success: true, data: [] });
      const methods = await db.query.paymentMethods.findMany({
        orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
      });
      res.json({ success: true, data: methods });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }`;

const newMethod = `  async getPaymentMethods(req: Request, res: Response) {
    try {
      if (!hasDatabase()) return res.json({ success: true, data: [] });
      const { db } = await import('../../db/index');
      const { paymentMethods } = await import('../../db/schema');
      let methods = await db.query.paymentMethods.findMany({
        orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
      });
      
      if (methods.length === 0) {
        // Just call wallet service to seed them if empty
        const { walletService } = await import('../services/walletService');
        await walletService.getActivePaymentMethods();
        methods = await db.query.paymentMethods.findMany({
          orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
        });
      }
      
      res.json({ success: true, data: methods });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }`;

if (code.includes('async getPaymentMethods(req: Request, res: Response) {')) {
  code = code.replace(oldMethod, newMethod);
  fs.writeFileSync('src/backend/controllers/adminController.ts', code);
}
