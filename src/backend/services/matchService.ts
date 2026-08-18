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
    
    const players = await db.select().from(users).where(eq(users.id, match.player1Id)).limit(1).then((res: any) => res[0]);
    const player1 = players;
    const player2 = await db.select().from(users).where(eq(users.id, match.player2Id)).limit(1).then((res: any) => res[0]);
    
    if (match.player1Id === userId) {
      currentUserUsername = player1?.username || 'Unknown';
      opponentUsername = player2?.username || 'Unknown';
    } else {
      currentUserUsername = player2?.username || 'Unknown';
      opponentUsername = player1?.username || 'Unknown';
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
      stake: match.stakeAmount,
      prize: match.prize,
      commission: match.commission,
      roomCode: match.roomCode,
      status: match.status,
      createdAt: match.createdAt,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt
    };
  }
}

export const matchService = new MatchService();
