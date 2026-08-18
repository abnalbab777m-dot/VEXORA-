import { db } from './index';
import { users, games, gameStakes } from './schema';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER)) {
    console.log('Database is not configured. Skipping seed.');
    return;
  }
  
  console.log('Seeding Admin User...');
  const adminEmail = 'admin@vexora.com';
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1).then(res => res[0]);
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('VexoraAdmin!2026', 10);
    await db.insert(users).values({
      username: 'VexoraAdmin',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN'
    });
    console.log('Admin user created: admin@vexora.com / VexoraAdmin!2026');
  } else {
    // Ensure the role is ADMIN
    await db.update(users).set({ role: 'ADMIN' }).where(eq(users.id, existingAdmin.id));
    console.log('Admin user already exists and role is guaranteed ADMIN.');
  }

  console.log('Updating Stakes...');
  const targetStakes = ['1.00', '2.50', '5.00', '10.00', '20.00', '50.00', '100.00'];
  const allGames = await db.select().from(games);
  
  for (const game of allGames) {
    // Deactivate old stakes not in the list
    const existingStakes = await db.select().from(gameStakes).where(eq(gameStakes.gameId, game.id));
    
    for (const stake of existingStakes) {
      if (!targetStakes.includes(stake.amount)) {
        await db.update(gameStakes).set({ status: 'INACTIVE' }).where(eq(gameStakes.id, stake.id));
        console.log(`Deactivated stake ${stake.amount} for game ${game.name}`);
      } else if (stake.status === 'INACTIVE') {
        await db.update(gameStakes).set({ status: 'ACTIVE' }).where(eq(gameStakes.id, stake.id));
        console.log(`Re-activated stake ${stake.amount} for game ${game.name}`);
      }
    }
    
    // Add missing stakes
    for (const targetAmount of targetStakes) {
      const stakeExists = existingStakes.find(s => s.amount === targetAmount);
      if (!stakeExists) {
        await db.insert(gameStakes).values({
          gameId: game.id,
          amount: targetAmount,
          currency: 'USD',
          status: 'ACTIVE'
        });
        console.log(`Created stake ${targetAmount} for game ${game.name}`);
      }
    }
  }

  console.log('Seeding completed.');
}

seed().catch(console.error).finally(() => process.exit(0));
