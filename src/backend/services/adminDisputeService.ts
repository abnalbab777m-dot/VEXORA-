import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { matchRepository } from '../repositories/matchRepository';
import { matchResultRepository } from '../repositories/matchResultRepository';
import { disputeRepository } from '../repositories/disputeRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { walletService } from './walletService';
import { settlementService } from './settlementService';
import { eq } from 'drizzle-orm';
import { matches, disputes, matchResults, users } from '../../db/schema';
import { Decimal } from 'decimal.js';

export class AdminDisputeService {
  async getAllDisputes() {
    if (!hasDatabase()) return [];
    
    // Fetch disputes with joined data
    const result = await db
      .select({
        dispute: disputes,
        match: matches,
      })
      .from(disputes)
      .leftJoin(matches, eq(disputes.matchId, matches.id))
      .orderBy(disputes.createdAt);
      
    // Fetch users for players
    // This is simple since we can do it after
    const userIds = new Set<string>();
    result.forEach(row => {
      if (row.match) {
        userIds.add(row.match.player1Id);
        userIds.add(row.match.player2Id);
      }
      userIds.add(row.dispute.raisedById);
    });
    
    const usersMap = new Map<string, any>();
    if (userIds.size > 0) {
      const usersData = await db.select().from(users); // could be optimized with inArray
      usersData.forEach(u => usersMap.set(u.id, u));
    }

    return result.map(row => ({
      ...row.dispute,
      match: row.match,
      player1: row.match ? usersMap.get(row.match.player1Id) : null,
      player2: row.match ? usersMap.get(row.match.player2Id) : null,
      openedBy: usersMap.get(row.dispute.raisedById)
    }));
  }

  async getDisputeById(id: string) {
    if (!hasDatabase()) return null;
    
    const dispute = await disputeRepository.findById(id);
    if (!dispute) return null;
    
    const match = await matchRepository.findById(dispute.matchId);
    if (!match) return null;
    
    const result = await matchResultRepository.findByMatchId(match.id);
    
    const allUsers = await db.select().from(users);
    const p1 = allUsers.find(u => u.id === match.player1Id);
    const p2 = allUsers.find(u => u.id === match.player2Id);
    const raisedBy = allUsers.find(u => u.id === dispute.raisedById);
    
    return {
      dispute,
      match,
      result,
      player1: p1,
      player2: p2,
      openedBy: raisedBy
    };
  }

  async resolveDispute(disputeId: string, resolution: string, adminUserId: string) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');
    
    if (!['PLAYER_1_WINS', 'PLAYER_2_WINS', 'REFUND_BOTH', 'CANCEL_MATCH'].includes(resolution)) {
      throw new Error('INVALID_RESOLUTION');
    }

    return await db.transaction(async (tx) => {
      const dispute = await disputeRepository.findByIdForUpdate(disputeId, tx);
      if (!dispute) throw new Error('DISPUTE_NOT_FOUND');
      
      if (['RESOLVED', 'CANCELLED'].includes(dispute.status)) {
        throw new Error('DISPUTE_ALREADY_RESOLVED');
      }

      const match = await matchRepository.findByIdForUpdate(dispute.matchId, tx);
      if (!match) throw new Error('MATCH_NOT_FOUND');
      
      if (['COMPLETED', 'CANCELLED'].includes(match.status)) {
        throw new Error('MATCH_ALREADY_FINALIZED');
      }
      
      const result = await matchResultRepository.findByMatchIdForUpdate(match.id, tx);
      
      await auditLogRepository.log(adminUserId, `ADMIN_${resolution}`, `Dispute ID: ${disputeId}, Match ID: ${match.id}`, undefined, tx);
      
      if (resolution === 'PLAYER_1_WINS' || resolution === 'PLAYER_2_WINS') {
        const winnerId = resolution === 'PLAYER_1_WINS' ? match.player1Id : match.player2Id;
        
        // Force the match result to be BOTH_CONFIRMED so settlement service accepts it
        if (result) {
           await matchResultRepository.update(result.id, {
             status: 'BOTH_CONFIRMED',
             winnerId: winnerId
           }, tx);
        } else {
           // Create a forced result if one doesn't exist
           await matchResultRepository.create({
             matchId: match.id,
             winnerId: winnerId,
             score: 'Admin Decision',
             status: 'BOTH_CONFIRMED',
             submittedBy: adminUserId
           }, tx);
        }
        
        // Temporarily lift the DISPUTED status so settlementService can process it
        await matchRepository.update(match.id, { status: 'UNDER_REVIEW' }, tx);
        
        // Use existing settlement logic!
        const { settlementService } = await import('./settlementService');
        await settlementService.settleMatch(match.id, winnerId, tx);
        
        await disputeRepository.update(disputeId, {
          status: 'RESOLVED',
          resolution,
          resolvedAt: new Date()
        }, tx);
        
      } else if (resolution === 'REFUND_BOTH' || resolution === 'CANCEL_MATCH') {
        // We must manually release locked funds back to available
        
        const playerStake = match.stakeAmount;
        
        // Refund Player 1
        await walletService.unlockFunds(match.player1Id, playerStake, `refund-p1-${match.id}`, tx);
        // Refund Player 2
        await walletService.unlockFunds(match.player2Id, playerStake, `refund-p2-${match.id}`, tx);
        
        await matchRepository.update(match.id, {
          status: 'CANCELLED',
          finishedAt: new Date()
        }, tx);
        
        if (result) {
          await matchResultRepository.update(result.id, { status: 'CANCELLED' }, tx);
        }
        
        await disputeRepository.update(disputeId, {
          status: 'RESOLVED',
          resolution,
          resolvedAt: new Date()
        }, tx);
        
        await auditLogRepository.log(adminUserId, 'ADMIN_REFUND_TRIGGERED', `Match ID: ${match.id}`, undefined, tx);
      }
      
      await auditLogRepository.log(adminUserId, 'DISPUTE_RESOLVED', `Dispute ID: ${disputeId}, Resolution: ${resolution}`, undefined, tx);
      
      return await disputeRepository.findById(disputeId);
    });
  }
}

export const adminDisputeService = new AdminDisputeService();
