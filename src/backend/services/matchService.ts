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

  async switchHost(matchId: string, userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');

    const match = await matchRepository.findById(matchId);
    if (!match) throw new Error('MATCH_NOT_FOUND');

    if (match.player1Id !== userId && match.player2Id !== userId) {
      throw new Error('MATCH_ACCESS_DENIED');
    }

    if (match.status !== 'PENDING' || match.roomCode) {
      throw new Error('HOST_SWITCH_NOT_ALLOWED');
    }

    const now = new Date();
    // Verify timer expiration or allow explicit trigger if expired
    const isExpired = match.hostTimerExpiresAt ? now >= new Date(match.hostTimerExpiresAt) : true;
    if (!isExpired) {
      const remainingSecs = Math.ceil((new Date(match.hostTimerExpiresAt!).getTime() - now.getTime()) / 1000);
      throw new Error(`HOST_TIMER_NOT_EXPIRED_${remainingSecs}S_REMAINING`);
    }

    const currentAttempts = match.hostAttempts || 1;
    const { matches } = await import('../../db/schema');

    if (currentAttempts >= 2) {
      // Both hosts failed to provide room code. Cancel match and refund stakes.
      await db.transaction(async (tx) => {
        await tx.update(matches).set({ status: 'CANCELLED' }).where(eq(matches.id, matchId));
        const { walletService } = await import('./walletService');
        await walletService.unlockFunds(match.player1Id, match.stakeAmount, `unlock-mm-match-${matchId}-p1`, tx);
        await walletService.unlockFunds(match.player2Id, match.stakeAmount, `unlock-mm-match-${matchId}-p2`, tx);
      });
      return { success: true, status: 'CANCELLED', message: 'Match cancelled due to host inactivity on both sides. Stakes refunded.' };
    }

    // Switch host to the other player with a fresh 3-minute timer
    const newHostId = match.hostUserId === match.player1Id ? match.player2Id : match.player1Id;
    const newTimerExpiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes limit
    const newAttempts = currentAttempts + 1;

    await db.update(matches).set({
      hostUserId: newHostId,
      hostTimerExpiresAt: newTimerExpiresAt,
      hostAttempts: newAttempts,
    }).where(eq(matches.id, matchId));

    return {
      success: true,
      status: 'PENDING',
      newHostId,
      hostTimerExpiresAt: newTimerExpiresAt,
      hostAttempts: newAttempts,
      message: 'Host privileges transferred successfully.'
    };
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
    let currentUserEfootball = '';
    let currentUserJawaker = '';
    let opponentEfootball = '';
    let opponentJawaker = '';
    
    const player1 = await db.select().from(users).where(eq(users.id, match.player1Id)).limit(1).then((res: any) => res[0]);
    const player2 = await db.select().from(users).where(eq(users.id, match.player2Id)).limit(1).then((res: any) => res[0]);
    
    const isPlayer1 = match.player1Id === userId;
    const me = isPlayer1 ? player1 : player2;
    const opp = isPlayer1 ? player2 : player1;

    if (me) {
      currentUserUsername = me.username || 'Unknown';
      currentUserEfootball = me.efootballUsername || me.gameUsername || '';
      currentUserJawaker = me.jawakerUsername || '';
      currentUserGameUsername = me.gameUsername || me.efootballUsername || '';
    }

    if (opp) {
      opponentUsername = opp.username || 'Unknown';
      opponentEfootball = opp.efootballUsername || opp.gameUsername || '';
      opponentJawaker = opp.jawakerUsername || '';
      opponentGameUsername = opp.gameUsername || opp.efootballUsername || '';
    }

    // Determine relevant in-game username based on game
    const isJawaker = game?.slug?.toLowerCase()?.includes('jawaker') || game?.name?.toLowerCase()?.includes('jawaker');
    const currentUserInGame = isJawaker ? (currentUserJawaker || currentUserGameUsername) : (currentUserEfootball || currentUserGameUsername);
    const opponentInGame = isJawaker ? (opponentJawaker || opponentGameUsername) : (opponentEfootball || opponentGameUsername);

    let { hostUserId, hostTimerExpiresAt, hostAttempts, status } = match;
    let roomCode = match.roomCode;
    
    if (status === 'PENDING' && !roomCode && hostTimerExpiresAt && new Date() > hostTimerExpiresAt) {
      if ((hostAttempts || 1) === 1) {
        hostUserId = hostUserId === match.player1Id ? match.player2Id : match.player1Id;
        hostTimerExpiresAt = new Date(Date.now() + 3 * 60 * 1000);
        hostAttempts = 2;
        const { matches } = await import('../../db/schema');
        await db.update(matches).set({ hostUserId, hostTimerExpiresAt, hostAttempts }).where(eq(matches.id, matchId));
      } else if ((hostAttempts || 1) >= 2) {
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
      gameSlug: game?.slug,
      player1: match.player1Id,
      player2: match.player2Id,
      currentUser: userId,
      opponent: opponentId,
      currentUserUsername,
      opponentUsername,
      currentUserGameUsername,
      opponentGameUsername,
      currentUserEfootball,
      currentUserJawaker,
      opponentEfootball,
      opponentJawaker,
      currentUserInGame,
      opponentInGame,
      stake: match.stakeAmount,
      prize: match.prize,
      commission: match.commission,
      roomCode,
      hostUserId,
      hostTimerExpiresAt,
      hostAttempts: hostAttempts || 1,
      status: status,
      createdAt: match.createdAt,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt
    };
  }
}

export const matchService = new MatchService();
