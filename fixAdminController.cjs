const fs = require('fs');
let code = fs.readFileSync('src/backend/controllers/adminController.ts', 'utf8');

const toInsert = `
  async getPaymentMethods(req: Request, res: Response) {
    try {
      if (!process.env.DATABASE_URL) return res.json({ success: true, data: [] });
      const methods = await db.query.paymentMethods.findMany({
        orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
      });
      res.json({ success: true, data: methods });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async createPaymentMethod(req: Request, res: Response) {
    try {
      if (!process.env.DATABASE_URL) return res.json({ success: true });
      const data = req.body;
      const result = await db.insert(paymentMethods).values(data).returning();
      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async updatePaymentMethod(req: Request, res: Response) {
    try {
      if (!process.env.DATABASE_URL) return res.json({ success: true });
      const { id } = req.params;
      const data = req.body;
      const result = await db.update(paymentMethods).set({ ...data, updatedAt: new Date() }).where(eq(paymentMethods.id, id)).returning();
      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
`;

// Also need to add paymentMethods and eq to imports
code = code.replace(`import { db } from '../../db';`, `import { db } from '../../db';\nimport { paymentMethods } from '../../db/schema';\nimport { eq } from 'drizzle-orm';`);
code = code.replace(`export class AdminController {`, `export class AdminController {` + toInsert);

fs.writeFileSync('src/backend/controllers/adminController.ts', code);
