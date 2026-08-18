import re

with open('src/backend/services/matchmakingService.ts', 'r') as f:
    c = f.read()

direct_match_method = """
  async createDirectMatch(player1Id: string, player2Id: string, gameId: string, stakeId: string) {
    return await db.transaction(async (tx) => {
      // Sort IDs to prevent deadlocks when locking wallets
      const sortedIds = [player1Id, player2Id].sort();
      await walletRepository.findByUserIdForUpdate(sortedIds[0], tx);
      await walletRepository.findByUserIdForUpdate(sortedIds[1], tx);

      const p1Active = await matchRepository.findActiveByUserId(player1Id, tx);
      if (p1Active) throw new Error('Player 1 is already in a match');
      const p2Active = await matchRepository.findActiveByUserId(player2Id, tx);
      if (p2Active) throw new Error('Player 2 is already in a match');

      const stakes = await gameService.getAvailableStakes(gameId);
      const stake = stakes.find(s => s.id === stakeId);
      if (!stake) throw new Error('Stake not found');
      
      const stakeAmount = Number(stake.amount);
      const commission = stakeAmount * 0.15;
      const prize = (stakeAmount * 2) - commission;
      const roomCode = this.generateRoomCode();

      // Lock wallets
      await walletService.lockBalanceTx(player1Id, stakeAmount, 'MATCH_LOCK', tx);
      await walletService.lockBalanceTx(player2Id, stakeAmount, 'MATCH_LOCK', tx);

      const [match] = await tx.insert(matches).values({
        gameId,
        player1Id,
        player2Id,
        stakeAmount: stakeAmount.toString(),
        prize: prize.toString(),
        commission: commission.toString(),
        status: 'READY',
        roomCode,
      }).returning();

      return match;
    });
  }
"""

c = c.replace("export class MatchmakingService {", "import { matches } from '../../db/schema';\n\nexport class MatchmakingService {\n" + direct_match_method)

with open('src/backend/services/matchmakingService.ts', 'w') as f:
    f.write(c)
