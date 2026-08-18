import re

with open('src/backend/controllers/adminController.ts', 'r') as f:
    c = f.read()

# I will just replace the closing brace of AdminController with the new methods and the closing brace.
methods = """
  async addStake(req: Request, res: Response) {
    try {
      const { gameId, amount } = req.body;
      if (!gameId || !amount) {
        return res.status(400).json({ success: false, error: 'gameId and amount required' });
      }
      
      const { db } = await import('../../../src/db');
      const { gameStakes } = await import('../../../src/db/schema');
      const { eq, and } = await import('drizzle-orm');

      const existing = await db.select().from(gameStakes).where(and(eq(gameStakes.gameId, gameId), eq(gameStakes.amount, amount))).limit(1).then(r => r[0]);
      if (existing) {
        await db.update(gameStakes).set({ status: 'ACTIVE' }).where(eq(gameStakes.id, existing.id));
      } else {
        await db.insert(gameStakes).values({
          gameId,
          amount,
          currency: 'USD',
          status: 'ACTIVE'
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to add stake' });
    }
  }

  async toggleStakeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db } = await import('../../../src/db');
      const { gameStakes } = await import('../../../src/db/schema');
      const { eq } = await import('drizzle-orm');

      const existing = await db.select().from(gameStakes).where(eq(gameStakes.id, id)).limit(1).then(r => r[0]);
      if (existing) {
        const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await db.update(gameStakes).set({ status: newStatus }).where(eq(gameStakes.id, id));
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to toggle stake' });
    }
  }
}
export const adminController = new AdminController();
"""

# Replace the last `}\nexport const adminController = new AdminController();` 
c = re.sub(r"\}\s*export const adminController = new AdminController\(\);\s*$", methods, c)

with open('src/backend/controllers/adminController.ts', 'w') as f:
    f.write(c)
