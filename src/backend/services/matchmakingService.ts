import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { matchmakingRepository } from '../repositories/matchmakingRepository';
import { matchRepository } from '../repositories/matchRepository';
import { gameService } from './gameService';
import { walletRepository } from '../repositories/walletRepository';
import { walletService } from './walletService';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

import { matches, wallets, walletTransactions } from '../../db/schema';

export class MatchmakingService {

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
      const p1Wallet = await walletRepository.findByUserIdForUpdate(player1Id, tx);
      const p2Wallet = await walletRepository.findByUserIdForUpdate(player2Id, tx);
      if (!p1Wallet || Number(p1Wallet.availableBalance) < stakeAmount) throw new Error('Player 1 insufficient available balance');
      if (!p2Wallet || Number(p2Wallet.availableBalance) < stakeAmount) throw new Error('Player 2 insufficient available balance');
      
      // Update p1 wallet
      await tx.update(wallets).set({
        availableBalance: (Number(p1Wallet.availableBalance) - stakeAmount).toString(),
        lockedBalance: (Number(p1Wallet.lockedBalance) + stakeAmount).toString(),
      }).where(eq(wallets.id, p1Wallet.id));
      
      // Update p2 wallet
      await tx.update(wallets).set({
        availableBalance: (Number(p2Wallet.availableBalance) - stakeAmount).toString(),
        lockedBalance: (Number(p2Wallet.lockedBalance) + stakeAmount).toString(),
      }).where(eq(wallets.id, p2Wallet.id));

      // Create transactions
      await tx.insert(walletTransactions).values([
        {
          userId: player1Id,
          walletId: p1Wallet.id,
          type: 'MATCH_LOCK',
          amount: (-stakeAmount).toString(),
          balanceBefore: p1Wallet.balance,
          balanceAfter: p1Wallet.balance,
          status: 'COMPLETED'
        },
        {
          userId: player2Id,
          walletId: p2Wallet.id,
          type: 'MATCH_LOCK',
          amount: (-stakeAmount).toString(),
          balanceBefore: p2Wallet.balance,
          balanceAfter: p2Wallet.balance,
          status: 'COMPLETED'
        }
      ]);


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

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async join(userId: string, gameId: string, stakeId: string, region?: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');

    const isGameActive = await gameService.isGameAvailable(gameId);
    if (!isGameActive) throw new Error('Game is not available for matchmaking');

    const isStakeActive = await gameService.isStakeAvailable(stakeId);
    if (!isStakeActive) throw new Error('Selected stake is not available');

    const stakes = await gameService.getAvailableStakes(gameId);
    const stake = stakes.find(s => s.id === stakeId);
    if (!stake) throw new Error('Stake not found for this game');

    const activeMatch = await matchRepository.findActiveByUserId(userId);
    if (activeMatch) throw new Error('User is already in an active match');

    const existingQueue = await matchmakingRepository.findActiveByUserId(userId);
    if (existingQueue) return { queue: existingQueue };

    return await db.transaction(async (tx) => {
      // Lock wallet FIRST to serialize concurrent requests for the same user
      await walletRepository.findByUserIdForUpdate(userId, tx);

      // Re-check existing queue in tx
      const existingTx = await matchmakingRepository.findActiveByUserIdForUpdate(userId, tx);
      if (existingTx) return { queue: existingTx };

      // Re-check active match in tx
      const activeMatchTx = await matchRepository.findActiveByUserId(userId, tx);
      if (activeMatchTx) throw new Error('User is already in an active match');

      // Lock funds
      const lockRef = `lock-mm-${userId}-${Date.now()}`;
      await walletService.lockFunds(userId, stake.amount, lockRef, tx);

      // Check if there is a compatible opponent
      const opponent = await matchmakingRepository.findOldestCompatible(gameId, stakeId, userId, tx);

      if (opponent) {
        // MATCH FOUND
        // 1. Update queue statuses
        await matchmakingRepository.updateStatus(opponent.id, 'MATCHED', tx);
        const myQueue = await matchmakingRepository.create({
          userId,
          gameId,
          stakeId,
          stakeAmount: stake.amount,
          region,
          status: 'MATCHED',
          matchedAt: new Date()
        }, tx);

        // 2. Create Match
        const roomCode = this.generateRoomCode();
        
        // Prize pool calculation (simulated for now based on rules)
        // Usually it's stake * 2 - commission (e.g. 25% of one stake? Or 25% of winnings?)
        // The prompt says "prize and commission may be calculated/stored... but NO payout should happen."
        // We'll do prize = stake * 1.8, commission = stake * 0.2
        const stakeAmountNum = Number(stake.amount);
        const prizeNum = stakeAmountNum * 1.8;
        const commNum = stakeAmountNum * 0.2;

        const match = await matchRepository.create({
          gameId,
          player1Id: opponent.userId,
          player2Id: userId,
          stakeAmount: stake.amount,
          prize: prizeNum.toFixed(2),
          commission: commNum.toFixed(2),
          status: 'PENDING',
          roomCode,
        }, tx);

        await auditLogRepository.log(userId, 'MATCHMAKING_JOINED', `Game: ${gameId}, Stake: ${stake.amount}`, undefined, tx);
        await auditLogRepository.log(userId, 'MATCHMAKING_MATCHED', `Match: ${match.id}`, undefined, tx);
        await auditLogRepository.log(opponent.userId, 'MATCHMAKING_MATCHED', `Match: ${match.id}`, undefined, tx);

        return { queue: myQueue, match };
      } else {
        // NO MATCH, JUST WAIT
        const queue = await matchmakingRepository.create({
          userId,
          gameId,
          stakeId,
          stakeAmount: stake.amount,
          region,
          status: 'WAITING'
        }, tx);
        
        await auditLogRepository.log(userId, 'MATCHMAKING_JOINED', `Game: ${gameId}, Stake: ${stake.amount}`, undefined, tx);
        return { queue };
      }
    });
  }

  async quickJoin(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    // Check if already in match or queue
    const activeMatch = await matchRepository.findActiveByUserId(userId);
    if (activeMatch) throw new Error('User is already in an active match');
    const existingQueue = await matchmakingRepository.findActiveByUserId(userId);
    if (existingQueue) throw new Error('User is already in the matchmaking queue');

    // Get all open lobbies excluding current user
    const openLobbies = await matchmakingRepository.findOpenLobbies(userId);
    if (openLobbies.length === 0) {
      throw new Error('NO_LOBBIES_FOUND');
    }

    // Get user's available balance
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    const availableBalance = Number(wallet.availableBalance);

    // Filter lobbies user can afford
    const affordableLobbies = openLobbies.filter(lobby => Number(lobby.stakeAmount) <= availableBalance);
    
    if (affordableLobbies.length === 0) {
      throw new Error('INSUFFICIENT_FUNDS_FOR_LOBBIES');
    }

    // Try to get user's stats
    const { statisticsService } = await import('./statisticsService');
    const userStats = await statisticsService.getUserStatistics(userId);
    const userWinRate = userStats.winRate || 0;

    // Enhance lobbies with creator's winrate
    const lobbiesWithStats = await Promise.all(affordableLobbies.map(async (lobby) => {
      const creatorStats = await statisticsService.getUserStatistics(lobby.userId);
      const creatorWinRate = creatorStats.winRate || 0;
      const winRateDiff = Math.abs(userWinRate - creatorWinRate);
      return { lobby, winRateDiff };
    }));

    // Sort by win rate difference (closest first)
    lobbiesWithStats.sort((a, b) => a.winRateDiff - b.winRateDiff);

    // Try joining the best lobbies in order until one succeeds
    for (const { lobby } of lobbiesWithStats) {
      try {
        const result = await this.join(userId, lobby.gameId, lobby.stakeId, lobby.region || undefined);
        if (result.match) {
           return result;
        }
      } catch (err: any) {
        // If joining fails (e.g. they got matched right before we tried), continue to the next
        console.error(`Failed to quick-join lobby ${lobby.id}:`, err.message);
      }
    }

    throw new Error('COULD_NOT_JOIN_ANY_LOBBY');
  }

  async cancel(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');

    return await db.transaction(async (tx) => {
      const existing = await matchmakingRepository.findActiveByUserIdForUpdate(userId, tx);
      if (!existing) throw new Error('No active matchmaking queue found');

      if (existing.status !== 'WAITING') {
        throw new Error('Cannot cancel a queue that is already matched or processed');
      }

      await matchmakingRepository.updateStatus(existing.id, 'CANCELLED', tx);
      
      const unlockRef = `unlock-mm-${userId}-${existing.id}`;
      await walletService.unlockFunds(userId, existing.stakeAmount.toString(), unlockRef, tx);

      await auditLogRepository.log(userId, 'MATCHMAKING_CANCELLED', `Queue: ${existing.id}`, undefined, tx);

      return { success: true };
    });
  }

  async expire(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    return await db.transaction(async (tx) => {
      const existing = await matchmakingRepository.findActiveByUserIdForUpdate(userId, tx);
      if (!existing) return { success: false };

      await matchmakingRepository.updateStatus(existing.id, 'EXPIRED', tx);
      
      const unlockRef = `expire-mm-${userId}-${existing.id}`;
      await walletService.unlockFunds(userId, existing.stakeAmount.toString(), unlockRef, tx);

      await auditLogRepository.log(userId, 'MATCHMAKING_EXPIRED', `Queue: ${existing.id}`, undefined, tx);

      return { success: true };
    });
  }

  async getStatus(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const activeMatch = await matchRepository.findActiveByUserId(userId);
    if (activeMatch) {
      const game = await gameService.getGameById(activeMatch.gameId);
      const opponentId = activeMatch.player1Id === userId ? activeMatch.player2Id : activeMatch.player1Id;
      let opponentUsername = 'Unknown';
      
      const opponentUser = await db.select().from(users).where(eq(users.id, opponentId)).limit(1).then((res: any) => res[0]);
      if (opponentUser) {
        opponentUsername = opponentUser.username;
      }

      return {
        status: 'MATCHED',
        matchId: activeMatch.id,
        game: game?.name,
        stake: activeMatch.stakeAmount,
        opponentId,
        opponentUsername,
        roomCode: activeMatch.roomCode,
        matchStatus: activeMatch.status
      };
    }

    const existingQueue = await matchmakingRepository.findActiveByUserId(userId);
    if (existingQueue) {
      const game = await gameService.getGameById(existingQueue.gameId);
      return {
        status: 'WAITING',
        game: game?.name,
        stake: existingQueue.stakeAmount
      };
    }

    return { status: 'NOT_IN_QUEUE' };
  }
}

export const matchmakingService = new MatchmakingService();
