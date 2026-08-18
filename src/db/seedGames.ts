import { db } from './index';
import { games, gameStakes } from './schema';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedGames() {
  if (!process.env.DATABASE_URL && !(process.env.SQL_HOST && process.env.SQL_USER)) {
    console.log('Database is not configured. Skipping seed.');
    return;
  }

  console.log('Seeding games...');

  const initialGames = [
    {
      name: 'eFootball',
      slug: 'efootball',
      description: 'The premier virtual football experience. Test your skills in 1v1 matches.',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop',
      status: 'ACTIVE',
      isMatchmakingEnabled: true,
      stakes: ['1.00', '2.50', '5.00', '10.00', '20.00', '50.00', '100.00']
    },
    {
      name: 'Jawaker / جواكر',
      slug: 'jawaker',
      description: 'The ultimate destination for Arabic card games like Tarneeb, Trix, and Baloot.',
      imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=2187&auto=format&fit=crop',
      status: 'ACTIVE',
      isMatchmakingEnabled: true,
      stakes: ['1.00', '2.50', '5.00', '10.00', '20.00', '50.00', '100.00']
    }
  ];

  for (const gameData of initialGames) {
    let game = await db.select().from(games).where(eq(games.slug, gameData.slug)).limit(1).then(res => res[0]);

    if (!game) {
      const [inserted] = await db.insert(games).values({
        name: gameData.name,
        slug: gameData.slug,
        description: gameData.description,
        imageUrl: gameData.imageUrl,
        status: gameData.status,
        isMatchmakingEnabled: gameData.isMatchmakingEnabled,
      }).returning();
      game = inserted;
      console.log(`Created game: ${game.name}`);
    } else {
      console.log(`Game ${game.name} already exists.`);
    }

    for (const amount of gameData.stakes) {
      const stake = await db.select().from(gameStakes).where(
        and(
          eq(gameStakes.gameId, game.id),
          eq(gameStakes.amount, amount)
        )
      ).limit(1).then(res => res[0]);

      if (!stake) {
        await db.insert(gameStakes).values({
          gameId: game.id,
          amount,
          currency: 'USD',
          status: 'ACTIVE'
        });
        console.log(`Created stake ${amount} for ${game.name}`);
      }
    }
  }

  console.log('Seeding completed.');
}

seedGames().catch(console.error).finally(() => process.exit(0));
