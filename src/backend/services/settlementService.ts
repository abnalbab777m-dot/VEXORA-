import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { Decimal } from 'decimal.js';
import { matchRepository } from '../repositories/matchRepository';
import { matchResultRepository } from '../repositories/matchResultRepository';
import { settlementRepository } from '../repositories/settlementRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { walletService } from './walletService';
import { walletTransactionRepository } from '../repositories/walletTransactionRepository'; // We need this for COMMISSION recording
import { walletRepository } from '../repositories/walletRepository';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class SettlementService {
  async settleMatch(matchId: string, requestUserId: string, outerTx?: any) {
    if (!hasDatabase()) throw new Error('DATABASE_NOT_CONFIGURED');

    const logic = async (tx: any) => {
      // 1. Lock Match
      const match = await matchRepository.findByIdForUpdate(matchId, tx);
      if (!match) throw new Error('MATCH_NOT_FOUND');

      // 2. Validate request user belongs to match
      if (match.player1Id !== requestUserId && match.player2Id !== requestUserId) {
        throw new Error('UNAUTHORIZED_USER');
      }

      // 3. Verify match is not already completed or cancelled
      if (['COMPLETED', 'CANCELLED'].includes(match.status)) {
        throw new Error('MATCH_ALREADY_FINALIZED');
      }

      if (match.status === 'DISPUTED') {
        throw new Error('DISPUTE_ACTIVE');
      }

      // 4. Check if settlement already exists for this match
      const existingSettlement = await settlementRepository.findByMatchIdForUpdate(matchId, tx);
      if (existingSettlement && existingSettlement.status === 'COMPLETED') {
        return existingSettlement; // Idempotency
      }

      // 5. Lock Result and verify
      const result = await matchResultRepository.findByMatchIdForUpdate(matchId, tx);
      if (!result) throw new Error('RESULT_NOT_FOUND');
      
      if (result.status !== 'BOTH_CONFIRMED') {
        throw new Error('RESULT_NOT_CONFIRMED');
      }

      // 6. Identify winner and loser
      const winnerId = result.winnerId;
      if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
        throw new Error('INVALID_WINNER');
      }
      const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

      await auditLogRepository.log(requestUserId, 'SETTLEMENT_STARTED', `Match ID: ${matchId}`, undefined, tx);

      // 7. Calculate Financials
      // Match stakeAmount is per player
      const playerStake = new Decimal(match.stakeAmount);
      const totalStake = playerStake.times(2);
      
      const commissionRate = new Decimal('0.15');
      const commissionAmount = totalStake.times(commissionRate);
      const prizeAmount = totalStake.minus(commissionAmount);

      // 8. Lock Wallets
      const winnerWallet = await walletRepository.findByUserIdForUpdate(winnerId, tx);
      const loserWallet = await walletRepository.findByUserIdForUpdate(loserId, tx);

      if (!winnerWallet || !loserWallet) {
        throw new Error('WALLET_NOT_FOUND');
      }

      // 9. Consume Locked Funds (This mimics paying the entry fee at the end)
      // They each locked `playerStake` amount.
      await walletService.releaseFunds(winnerId, playerStake.toFixed(2), `release-winner-${matchId}`, tx);
      await walletService.releaseFunds(loserId, playerStake.toFixed(2), `release-loser-${matchId}`, tx);

      // Update loser's total losses explicitly
      const newLoserLosses = new Decimal(loserWallet.totalLosses).plus(playerStake);
      await walletRepository.update(loserWallet.id, {
        totalLosses: newLoserLosses.toFixed(2)
      }, tx);

      // 10. Record Commission (and Credit Winner with Gross - Commission)
      const adminUsers = await tx.select().from(users).where(eq(users.role, 'ADMIN')).limit(1);
      
      const grossPrizeAmount = totalStake;

      const winnerCurrentWallet = await walletRepository.findByUserIdForUpdate(winnerId, tx);
      if (!winnerCurrentWallet) throw new Error('WALLET_NOT_FOUND');

      // Add Gross Prize
      const newAvailableGross = new Decimal(winnerCurrentWallet.availableBalance).plus(grossPrizeAmount);
      const newTotalGross = new Decimal(winnerCurrentWallet.balance).plus(grossPrizeAmount);
      
      // Deduct Commission
      const newAvailableNet = newAvailableGross.minus(commissionAmount);
      const newTotalNet = newTotalGross.minus(commissionAmount);
      
      // Update Winnings with NET prize
      const newWinnings = new Decimal(winnerCurrentWallet.totalWinnings).plus(prizeAmount);

      await walletRepository.update(winnerCurrentWallet.id, {
        balance: newTotalNet.toFixed(2),
        availableBalance: newAvailableNet.toFixed(2),
        totalWinnings: newWinnings.toFixed(2)
      }, tx);

      // Create PRIZE transaction (GROSS)
      await walletTransactionRepository.create({
        userId: winnerId,
        walletId: winnerCurrentWallet.id,
        type: 'PRIZE',
        amount: grossPrizeAmount.toFixed(2),
        balanceBefore: winnerCurrentWallet.balance,
        balanceAfter: newTotalGross.toFixed(2),
        status: 'COMPLETED',
        referenceId: `prize-${matchId}`,
      }, tx);

      // Create COMMISSION transaction (EXPENSE)
      await walletTransactionRepository.create({
        userId: winnerId,
        walletId: winnerCurrentWallet.id,
        type: 'COMMISSION',
        amount: commissionAmount.toFixed(2),
        balanceBefore: newTotalGross.toFixed(2),
        balanceAfter: newTotalNet.toFixed(2),
        status: 'COMPLETED',
        referenceId: `comm-${matchId}`,
      }, tx);

      await auditLogRepository.log(winnerId, 'PRIZE_CREDITED', `Gross Amount: ${grossPrizeAmount.toFixed(2)}, Ref: prize-${matchId}`, undefined, tx);
      await auditLogRepository.log(winnerId, 'COMMISSION_PAID', `Amount: ${commissionAmount.toFixed(2)}, Ref: comm-${matchId}`, undefined, tx);

      // 12. Create Settlement Record
      const settlement = await settlementRepository.create({
        matchId,
        winnerId,
        loserId,
        totalStake: totalStake.toFixed(2),
        commissionRate: commissionRate.toFixed(4),
        commissionAmount: commissionAmount.toFixed(2),
        prizeAmount: prizeAmount.toFixed(2),
        status: 'COMPLETED',
        idempotencyKey: `settle-${matchId}`,
        completedAt: new Date()
      }, tx);

      // 13. Mark Match and Result as COMPLETED
      await matchRepository.update(matchId, {
        status: 'COMPLETED',
        winnerId: winnerId,
        finishedAt: new Date()
      }, tx);
      
      await matchResultRepository.update(result.id, {
        status: 'COMPLETED'
      }, tx);

      await auditLogRepository.log(requestUserId, 'SETTLEMENT_COMPLETED', `Match ID: ${matchId}, Winner: ${winnerId}`, undefined, tx);

      return settlement;
    };

    return outerTx ? await logic(outerTx) : await db.transaction(logic);
  }
}

export const settlementService = new SettlementService();
