import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { matchRepository } from '../repositories/matchRepository';
import { matchResultRepository } from '../repositories/matchResultRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';

export class MatchResultService {
  async submitResult(matchId: string, userId: string, winnerId: string, score: string, evidenceUrl?: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    // Validations
    if (!score || score.length > 20) throw new Error('INVALID_SCORE');
    if (evidenceUrl && evidenceUrl.length > 2048) throw new Error('INVALID_EVIDENCE_URL');
    if (evidenceUrl && !evidenceUrl.startsWith('http')) throw new Error('INVALID_EVIDENCE_URL');

    return await db.transaction(async (tx) => {
      const match = await matchRepository.findByIdForUpdate(matchId, tx);
      if (!match) throw new Error('MATCH_NOT_FOUND');
      
      if (match.player1Id !== userId && match.player2Id !== userId) {
        throw new Error('MATCH_ACCESS_DENIED');
      }

      if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
        throw new Error('INVALID_WINNER');
      }

      // Check valid match status
      if (['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(match.status)) {
        throw new Error('MATCH_ALREADY_FINALIZED');
      }

      const existingResult = await matchResultRepository.findByMatchIdForUpdate(matchId, tx);

      let status = userId === match.player1Id ? 'PLAYER_1_SUBMITTED' : 'PLAYER_2_SUBMITTED';

      if (existingResult) {
        // Idempotent check
        if (existingResult.submittedBy === userId) {
          if (existingResult.winnerId === winnerId && existingResult.score === score) {
            return existingResult; // Same submission
          }
          throw new Error('MULTIPLE_CONFLICTING_RESULTS');
        }

        // If the other player already submitted, they can only confirm or dispute, not submit via this route.
        // Actually, if the other player submitted, we could auto-confirm if it matches, or dispute if it conflicts.
        // But the requirement says to use /confirm or /dispute endpoints.
        // Let's prevent submitting over an opponent's result.
        throw new Error('OPPONENT_ALREADY_SUBMITTED');
      }

      const result = await matchResultRepository.create({
        matchId,
        winnerId,
        score,
        evidenceUrl: evidenceUrl || null,
        submittedBy: userId,
        status,
      }, tx);

      await matchRepository.update(matchId, { status: 'RESULT_SUBMITTED' }, tx);
      
      await auditLogRepository.log(
        userId,
        'RESULT_SUBMITTED',
        JSON.stringify({ matchId, winnerId, score, status }),
        undefined,
        tx
      );

      return result;
    });
  }

  async confirmResult(matchId: string, userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');

    return await db.transaction(async (tx) => {
      const match = await matchRepository.findByIdForUpdate(matchId, tx);
      if (!match) throw new Error('MATCH_NOT_FOUND');
      
      if (match.player1Id !== userId && match.player2Id !== userId) {
        throw new Error('MATCH_ACCESS_DENIED');
      }

      const existingResult = await matchResultRepository.findByMatchIdForUpdate(matchId, tx);
      if (!existingResult) throw new Error('NO_RESULT_TO_CONFIRM');

      if (existingResult.submittedBy === userId) {
        throw new Error('CANNOT_CONFIRM_OWN_RESULT');
      }

      if (existingResult.status === 'BOTH_CONFIRMED') {
        return existingResult; // Idempotent
      }

      if (existingResult.status === 'DISPUTED') {
        throw new Error('RESULT_ALREADY_DISPUTED');
      }

      const updatedResult = await matchResultRepository.update(existingResult.id, {
        status: 'BOTH_CONFIRMED'
      }, tx);

      await matchRepository.update(matchId, { status: 'UNDER_REVIEW' }, tx);

      await auditLogRepository.log(
        userId,
        'RESULT_CONFIRMED',
        JSON.stringify({ matchId, resultId: existingResult.id }),
        undefined,
        tx
      );

      return updatedResult;
    });
  }

  async disputeResult(matchId: string, userId: string, reason: string = 'Player disputed the result') {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');

    const result = await db.transaction(async (tx) => {
      const match = await matchRepository.findByIdForUpdate(matchId, tx);
      if (!match) throw new Error('MATCH_NOT_FOUND');
      
      if (match.player1Id !== userId && match.player2Id !== userId) {
        throw new Error('MATCH_ACCESS_DENIED');
      }

      if (['COMPLETED', 'CANCELLED'].includes(match.status)) {
        throw new Error('MATCH_ALREADY_FINALIZED');
      }

      const existingResult = await matchResultRepository.findByMatchIdForUpdate(matchId, tx);
      
      // We can allow disputing even if no result is formally submitted yet if a player is unresponsive,
      // but for this phase, let's strictly dispute submitted results.
      if (!existingResult) throw new Error('NO_RESULT_TO_DISPUTE');

      if (existingResult.status === 'DISPUTED') {
        return existingResult; // Idempotent
      }

      const updatedResult = await matchResultRepository.update(existingResult.id, {
        status: 'DISPUTED'
      }, tx);

      await matchRepository.update(matchId, { status: 'DISPUTED' }, tx);
      
      // Check if dispute already exists
      const { disputeRepository } = await import('../repositories/disputeRepository');
      const existingDispute = await disputeRepository.findByMatchIdForUpdate(matchId, tx);
      if (!existingDispute) {
        await disputeRepository.create({
          matchId,
          raisedById: userId,
          reason,
          status: 'OPEN'
        }, tx);
      }

      await auditLogRepository.log(
        userId,
        'RESULT_DISPUTED',
        JSON.stringify({ matchId, resultId: existingResult.id }),
        undefined,
        tx
      );

      return updatedResult;
    });

    // Async Telegram Notification
    import('./telegramService').then(async ({ telegramService }) => {
      try {
        const { matchRepository } = await import('../repositories/matchRepository');
        const { userRepository } = await import('../repositories/userRepository');
        const match = await matchRepository.findById(matchId);
        
        let raisedByUsername = userId;
        let opponentUsername = '';
        
        if (match) {
          const [raisedUser, oppUser] = await Promise.all([
            userRepository.findById(userId),
            userRepository.findById(match.player1Id === userId ? match.player2Id : match.player1Id)
          ]);
          if (raisedUser) raisedByUsername = raisedUser.username;
          if (oppUser) opponentUsername = oppUser.username;
        }

        telegramService.notifyDispute({
          matchId,
          raisedBy: raisedByUsername,
          opponent: opponentUsername,
          gameName: match?.gameId,
          stakeAmount: match?.stakeAmount,
          prize: match?.prize,
          reason
        }).catch(e => console.error('Telegram notification failed:', e));
      } catch (e) {}
    });

    return result;
  }

  async getResult(matchId: string, userId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    const match = await matchRepository.findById(matchId);
    if (!match) throw new Error('MATCH_NOT_FOUND');
    
    if (match.player1Id !== userId && match.player2Id !== userId) {
      throw new Error('MATCH_ACCESS_DENIED');
    }

    return await matchResultRepository.findByMatchId(matchId);
  }
}

export const matchResultService = new MatchResultService();
