import { hasDatabase } from '../../db/index';
import { matchRepository } from '../repositories/matchRepository';
import { gameService } from './gameService';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class MatchService {
  async getUserMatches(userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const matches = await matchRepository.findByUserId(userId);
    const enrichedMatches = [];
    
    for (const match of matches) {
      const game = await gameService.getGameById(match.gameId);
      const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
      
      let opponentUsername = 'Unknown';
      const opponentUser = await db.select().from(users).where(eq(users.id, opponentId)).limit(1).then((res: any) => res[0]);
      if (opponentUser) {
        opponentUsername = opponentUser.username;
      }

      enrichedMatches.push({
        id: match.id,
        game: game?.name,
        stake: match.stakeAmount,
        status: match.status,
        opponentId,
        opponentUsername,
        winnerId: match.winnerId,
        prize: match.prize,
        createdAt: match.createdAt,
      });
    }
    
    return enrichedMatches;
  }

  async setRoomCode(matchId: string, userId: string, roomCode: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const match = await matchRepository.findById(matchId);
    if (!match) throw new Error('MATCH_NOT_FOUND');
    
    if (match.hostUserId !== userId) {
      throw new Error('ONLY_HOST_CAN_SET_ROOM_CODE');
    }

    if (match.status !== 'PENDING' && match.status !== 'READY') {
      throw new Error('MATCH_NOT_IN_PENDING_STATE');
    }

    if (match.hostTimerExpiresAt && new Date() > match.hostTimerExpiresAt) {
      throw new Error('HOST_TIMER_EXPIRED');
    }

    const { matches } = await import('../../db/schema');
    await db.update(matches).set({ roomCode }).where(eq(matches.id, matchId));

    return { success: true };
  }

  async getMatchById(matchId: string, userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const match = await matchRepository.findById(matchId);
    if (!match) throw new Error('MATCH_NOT_FOUND');
    
    if (match.player1Id !== userId && match.player2Id !== userId) {
      throw new Error('MATCH_ACCESS_DENIED');
    }
    
    const game = await gameService.getGameById(match.gameId);
    const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
    
    let opponentUsername = 'Unknown';
    let currentUserUsername = 'Unknown';
    let opponentGameUsername = 'Unknown';
    let currentUserGameUsername = 'Unknown';
    
    const player1 = await db.select().from(users).where(eq(users.id, match.player1Id)).limit(1).then((res: any) => res[0]);
    const player2 = await db.select().from(users).where(eq(users.id, match.player2Id)).limit(1).then((res: any) => res[0]);
    
    if (match.player1Id === userId) {
      currentUserUsername = player1?.username || 'Unknown';
      opponentUsername = player2?.username || 'Unknown';
      currentUserGameUsername = player1?.gameUsername || '';
      opponentGameUsername = player2?.gameUsername || '';
    } else {
      currentUserUsername = player2?.username || 'Unknown';
      opponentUsername = player1?.username || 'Unknown';
      currentUserGameUsername = player2?.gameUsername || '';
      opponentGameUsername = player1?.gameUsername || '';
    }

    let { hostUserId, hostTimerExpiresAt, hostAttempts, status } = match;
    let roomCode = match.roomCode;
    
    if (status === 'PENDING' && !roomCode && hostTimerExpiresAt && new Date() > hostTimerExpiresAt) {
      if (hostAttempts === 1) {
        hostUserId = hostUserId === match.player1Id ? match.player2Id : match.player1Id;
        hostTimerExpiresAt = new Date(Date.now() + 3 * 60 * 1000);
        hostAttempts = 2;
        const { matches } = await import('../../db/schema');
        await db.update(matches).set({ hostUserId, hostTimerExpiresAt, hostAttempts }).where(eq(matches.id, matchId));
      } else if (hostAttempts >= 2) {
        const { matchmakingService } = await import('./matchmakingService');
        await db.transaction(async (tx) => {
          const { matches } = await import('../../db/schema');
          await tx.update(matches).set({ status: 'CANCELLED' }).where(eq(matches.id, matchId));
          const { walletService } = await import('./walletService');
          await walletService.unlockFunds(match.player1Id, match.stakeAmount, `unlock-mm-match-${matchId}-p1`, tx);
          await walletService.unlockFunds(match.player2Id, match.stakeAmount, `unlock-mm-match-${matchId}-p2`, tx);
        });
        status = 'CANCELLED';
      }
    }

    return {
      matchId: match.id,
      game: game?.name,
      player1: match.player1Id,
      player2: match.player2Id,
      currentUser: userId,
      opponent: opponentId,
      currentUserUsername,
      opponentUsername,
      currentUserGameUsername,
      opponentGameUsername,
      stake: match.stakeAmount,
      prize: match.prize,
      commission: match.commission,
      roomCode,
      hostUserId,
      hostTimerExpiresAt,
      hostAttempts,
      status: status,
      createdAt: match.createdAt,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt
    };
  }
}

export const matchService = new MatchService();
