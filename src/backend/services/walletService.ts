import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { walletRepository } from '../repositories/walletRepository';
import { walletTransactionRepository } from '../repositories/walletTransactionRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { wallets, walletTransactions, auditLogs, notifications } from '../../db/schema';
import Decimal from 'decimal.js';

export class WalletService {
  async getWallet(userId: string) {
    if (!hasDatabase()) {
      return {
        id: 'mock-wallet-id',
        userId,
        balance: '0.00',
        availableBalance: '0.00',
        lockedBalance: '0.00',
        totalDeposits: '0.00',
        totalWithdrawals: '0.00',
        totalWinnings: '0.00',
        totalLosses: '0.00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    let wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
        wallet = await walletRepository.create(userId);
    }
    return wallet;
  }

  async getActivePaymentMethods() {
    if (!hasDatabase()) return [];
    try {
      const { db } = await import('../../db/index');
      const { paymentMethods } = await import('../../db/schema');
      let methods = await db.query.paymentMethods.findMany({
        where: (paymentMethods, { eq }) => eq(paymentMethods.isActive, true),
        orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
      });
      
      // Seed default payment methods if database is completely empty
      if (methods.length === 0) {
        console.log('Seeding default payment methods...');
        const defaultMethods = [
          { name: 'Turkish Bank', type: 'BANK', details: { iban: 'TR77 0082 9000 0949 1962 5420 51', accountHolder: 'RUBA ALİ AL HUSSEİN' }, isActive: true, displayOrder: 1 },
          { name: 'Sham Cash — USD', type: 'E_WALLET', details: { address: '2f06deb324861ace61b595af570a7dfa' }, isActive: true, displayOrder: 2 },
          { name: 'USDT — BEP20', type: 'CRYPTO', details: { address: '0x6b0dd72b14e64f75cf4355d1bca128f14c950647', network: 'BEP20' }, isActive: true, displayOrder: 3 },
          { name: 'USDT — TRC20', type: 'CRYPTO', details: { address: 'TYXk6MdKCRNcj84sDtTVe1rwdqJStQWfVB', network: 'TRC20' }, isActive: true, displayOrder: 4 }
        ];
        for (const m of defaultMethods) {
          await db.insert(paymentMethods).values(m);
        }
        methods = await db.query.paymentMethods.findMany({
          where: (paymentMethods, { eq }) => eq(paymentMethods.isActive, true),
          orderBy: (paymentMethods, { asc }) => asc(paymentMethods.displayOrder)
        });
      }
      
      return methods;
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      return [];
    }
  }

  async getTransactions(userId: string) {
    if (!hasDatabase()) return [];
    return await walletTransactionRepository.findByUserId(userId);
  }

  async createDepositRequest(userId: string, amount: string, idempotencyKey: string, metadata?: any) {
    if (!hasDatabase()) throw new Error('Database is not configured');

    const depositAmount = new Decimal(amount);
    if (depositAmount.lte(0)) throw new Error('Amount must be greater than zero');

    return await db.transaction(async (tx) => {
      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
      if (!wallet) wallet = await walletRepository.create(userId, tx);
      const existing = await walletTransactionRepository.findByIdempotencyKey(idempotencyKey, tx);
      if (existing) return existing;

      const transaction = await walletTransactionRepository.create({
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: depositAmount.toFixed(2),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, // Balance does NOT change on PENDING deposit
        status: 'PENDING',
        referenceId: idempotencyKey,
        metadata: metadata || null,
      }, tx);

      await auditLogRepository.log(userId, 'DEPOSIT_REQUEST', `Amount: ${amount}, Ref: ${idempotencyKey}`, undefined, tx);
      return transaction;
    });
  }

  async createWithdrawalRequest(userId: string, amount: string, idempotencyKey: string, metadata?: any) {
    if (!hasDatabase()) throw new Error('Database is not configured');

    const withdrawAmount = new Decimal(amount);
    if (withdrawAmount.lte(0)) throw new Error('Amount must be greater than zero');

    return await db.transaction(async (tx) => {
      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
      if (!wallet) wallet = await walletRepository.create(userId, tx);
      const existing = await walletTransactionRepository.findByIdempotencyKey(idempotencyKey, tx);
      if (existing) return existing;

      const available = new Decimal(wallet.availableBalance);
      if (available.lt(withdrawAmount)) {
        throw new Error('Insufficient available balance');
      }

      const newAvailable = available.minus(withdrawAmount);
      const newLocked = new Decimal(wallet.lockedBalance).plus(withdrawAmount);

      await walletRepository.update(wallet.id, {
        availableBalance: newAvailable.toFixed(2),
        lockedBalance: newLocked.toFixed(2),
      }, tx);

      const transaction = await walletTransactionRepository.create({
        userId,
        walletId: wallet.id,
        type: 'WITHDRAW',
        amount: withdrawAmount.toFixed(2),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, // Overall balance is same until completed
        status: 'PENDING',
        referenceId: idempotencyKey,
        metadata: metadata || null,
      }, tx);

      await auditLogRepository.log(userId, 'WITHDRAWAL_REQUEST', `Amount: ${amount}, Ref: ${idempotencyKey}`, undefined, tx);
      return transaction;
    });
  }

  async lockFunds(userId: string, amount: string, referenceId: string, outerTx?: any) {
    if (!hasDatabase()) throw new Error('Database is not configured');
    
    const lockAmount = new Decimal(amount);
    if (lockAmount.lte(0)) throw new Error('Amount must be greater than zero');

    const logic = async (tx: any) => {
      const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
      if (!wallet) throw new Error('Wallet not found');
      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);
      if (existing) return existing;

      const available = new Decimal(wallet.availableBalance);
      if (available.lt(lockAmount)) {
        throw new Error('Insufficient available balance');
      }

      const newAvailable = available.minus(lockAmount);
      const newLocked = new Decimal(wallet.lockedBalance).plus(lockAmount);

      await walletRepository.update(wallet.id, {
        availableBalance: newAvailable.toFixed(2),
        lockedBalance: newLocked.toFixed(2),
      }, tx);

      const transaction = await walletTransactionRepository.create({
        userId,
        walletId: wallet.id,
        type: 'MATCH_LOCK',
        amount: lockAmount.toFixed(2),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, // total doesn't change
        status: 'COMPLETED',
        referenceId,
      }, tx);

      await auditLogRepository.log(userId, 'FUNDS_LOCKED', `Amount: ${amount}, Ref: ${referenceId}`, undefined, tx);
      return transaction;
    };

    return outerTx ? await logic(outerTx) : await db.transaction(logic);
  }

  async unlockFunds(userId: string, amount: string, referenceId: string, outerTx?: any) {
    if (!hasDatabase()) throw new Error('Database is not configured');
    const unlockAmount = new Decimal(amount);
    
    const logic = async (tx: any) => {
      const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
      if (!wallet) throw new Error('Wallet not found');
      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);
      if (existing) return existing;

      const locked = new Decimal(wallet.lockedBalance);
      if (locked.lt(unlockAmount)) throw new Error('Insufficient locked balance');

      const newAvailable = new Decimal(wallet.availableBalance).plus(unlockAmount);
      const newLocked = locked.minus(unlockAmount);

      await walletRepository.update(wallet.id, {
        availableBalance: newAvailable.toFixed(2),
        lockedBalance: newLocked.toFixed(2),
      }, tx);

      const transaction = await walletTransactionRepository.create({
        userId,
        walletId: wallet.id,
        type: 'MATCH_RELEASE',
        amount: unlockAmount.toFixed(2),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        status: 'COMPLETED',
        referenceId,
      }, tx);

      await auditLogRepository.log(userId, 'FUNDS_UNLOCKED', `Amount: ${amount}, Ref: ${referenceId}`, undefined, tx);
      return transaction;
    };

    return outerTx ? await logic(outerTx) : await db.transaction(logic);
  }

  async releaseFunds(userId: string, amount: string, referenceId: string, outerTx?: any) {
     if (!hasDatabase()) throw new Error('Database is not configured');
     const releaseAmount = new Decimal(amount);
     
     const logic = async (tx: any) => {
       const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
       if (!wallet) throw new Error('Wallet not found');
       const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);
       if (existing) return existing;

       const locked = new Decimal(wallet.lockedBalance);
       if (locked.lt(releaseAmount)) throw new Error('Insufficient locked balance');

       const newLocked = locked.minus(releaseAmount);
       const currentTotal = new Decimal(wallet.balance);
       const newTotal = currentTotal.minus(releaseAmount);

       await walletRepository.update(wallet.id, {
         lockedBalance: newLocked.toFixed(2),
         balance: newTotal.toFixed(2),
       }, tx);

       const transaction = await walletTransactionRepository.create({
         userId,
         walletId: wallet.id,
         type: 'MATCH_ENTRY',
         amount: releaseAmount.toFixed(2),
         balanceBefore: currentTotal.toFixed(2),
         balanceAfter: newTotal.toFixed(2),
         status: 'COMPLETED',
         referenceId,
       }, tx);

       await auditLogRepository.log(userId, 'FUNDS_RELEASED', `Amount: ${amount}, Ref: ${referenceId}`, undefined, tx);
       return transaction;
     };

     return outerTx ? await logic(outerTx) : await db.transaction(logic);
  }

  async creditPrize(userId: string, amount: string, referenceId: string, outerTx?: any) {
    if (!hasDatabase()) throw new Error('Database is not configured');
    const prizeAmount = new Decimal(amount);
    
    const logic = async (tx: any) => {
      let wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
      if (!wallet) wallet = await walletRepository.create(userId, tx);
      const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);
      if (existing) return existing;

      const currentTotal = new Decimal(wallet.balance);
      const currentAvailable = new Decimal(wallet.availableBalance);
      const currentWinnings = new Decimal(wallet.totalWinnings);

      const newTotal = currentTotal.plus(prizeAmount);
      const newAvailable = currentAvailable.plus(prizeAmount);
      const newWinnings = currentWinnings.plus(prizeAmount);

      await walletRepository.update(wallet.id, {
        balance: newTotal.toFixed(2),
        availableBalance: newAvailable.toFixed(2),
        totalWinnings: newWinnings.toFixed(2)
      }, tx);

      const transaction = await walletTransactionRepository.create({
        userId,
        walletId: wallet.id,
        type: 'PRIZE',
        amount: prizeAmount.toFixed(2),
        balanceBefore: currentTotal.toFixed(2),
        balanceAfter: newTotal.toFixed(2),
        status: 'COMPLETED',
        referenceId,
      }, tx);

      await auditLogRepository.log(userId, 'PRIZE_CREDITED', `Amount: ${amount}, Ref: ${referenceId}`, undefined, tx);
      return transaction;
    };

    return outerTx ? await logic(outerTx) : await db.transaction(logic);
  }

  async refundFunds(userId: string, amount: string, referenceId: string) {
     if (!hasDatabase()) throw new Error('Database is not configured');
     const refundAmount = new Decimal(amount);
     
     return await db.transaction(async (tx) => {
       const wallet = await walletRepository.findByUserIdForUpdate(userId, tx);
       if (!wallet) throw new Error('Wallet not found');
       const existing = await walletTransactionRepository.findByIdempotencyKey(referenceId, tx);
       if (existing) return existing;
 
       const newAvailable = new Decimal(wallet.availableBalance).plus(refundAmount);
       const currentTotal = new Decimal(wallet.balance);
       const newTotal = currentTotal.plus(refundAmount);
 
       await walletRepository.update(wallet.id, {
         availableBalance: newAvailable.toFixed(2),
         balance: newTotal.toFixed(2),
       }, tx);
 
       const transaction = await walletTransactionRepository.create({
         userId,
         walletId: wallet.id,
         type: 'REFUND',
         amount: refundAmount.toFixed(2),
         balanceBefore: currentTotal.toFixed(2),
         balanceAfter: newTotal.toFixed(2),
         status: 'COMPLETED',
         referenceId,
       }, tx);
 
       await auditLogRepository.log(userId, 'FUNDS_REFUNDED', `Amount: ${amount}, Ref: ${referenceId}`, undefined, tx);
       return transaction;
     });
  }
  async approveTransaction(transactionId: string, adminId: string) {
    return await db.transaction(async (tx) => {
      const transaction = await tx.query.walletTransactions.findFirst({
        where: eq(walletTransactions.id, transactionId),
      });
      if (!transaction || transaction.status !== 'PENDING') throw new Error('Invalid transaction');

      const wallet = await tx.query.wallets.findFirst({
        where: eq(wallets.id, transaction.walletId),
      });
      if (!wallet) throw new Error('Wallet not found');

      let newBalance = Number(wallet.balance);
      let newAvailable = Number(wallet.availableBalance);
      let newLocked = Number(wallet.lockedBalance);
      let newTotalDeposits = Number(wallet.totalDeposits);
      let newTotalWithdrawals = Number(wallet.totalWithdrawals);
      
      const amount = Number(transaction.amount);

      if (transaction.type === 'DEPOSIT') {
        newBalance += amount;
        newAvailable += amount;
        newTotalDeposits += amount;
        await tx.insert(notifications).values({
          userId: transaction.userId,
          type: 'DEPOSIT_APPROVED',
          title: 'Deposit Approved',
          message: `Your deposit of $${amount.toFixed(2)} has been approved.`,
        });
      } else if (transaction.type === 'WITHDRAW') {
        newBalance -= amount;
        newLocked -= amount;
        newTotalWithdrawals += amount;
        await tx.insert(notifications).values({
          userId: transaction.userId,
          type: 'WITHDRAWAL_APPROVED',
          title: 'Withdrawal Approved',
          message: `Your withdrawal of $${amount.toFixed(2)} has been approved and processed.`,
        });
      }

      await tx.update(walletTransactions)
        .set({ status: 'COMPLETED', balanceAfter: newBalance.toString() })
        .where(eq(walletTransactions.id, transactionId));

      await tx.update(wallets)
        .set({ 
          balance: newBalance.toString(), 
          availableBalance: newAvailable.toString(),
          lockedBalance: newLocked.toString(),
          totalDeposits: newTotalDeposits.toString(),
          totalWithdrawals: newTotalWithdrawals.toString(),
          updatedAt: new Date()
        })
        .where(eq(wallets.id, wallet.id));

      await tx.insert(auditLogs).values({
        userId: adminId,
        action: 'APPROVE_TRANSACTION',
        details: JSON.stringify({ transactionId, type: transaction.type, amount: transaction.amount })
      });

      return { success: true };
    });
  }

  async rejectTransaction(transactionId: string, adminId: string, reason: string) {
    return await db.transaction(async (tx) => {
      const transaction = await tx.query.walletTransactions.findFirst({
        where: eq(walletTransactions.id, transactionId),
      });
      if (!transaction || transaction.status !== 'PENDING') throw new Error('Invalid transaction');

      const amount = Number(transaction.amount);
      
      if (transaction.type === 'WITHDRAW') {
        const wallet = await tx.query.wallets.findFirst({
          where: eq(wallets.id, transaction.walletId),
        });
        if (wallet) {
          const newAvailable = Number(wallet.availableBalance) + amount;
          const newLocked = Number(wallet.lockedBalance) - amount;
          await tx.update(wallets)
            .set({ 
              availableBalance: newAvailable.toString(),
              lockedBalance: newLocked.toString(),
              updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id));
        }
      }
      
      await tx.update(walletTransactions)
        .set({ status: 'FAILED' })
        .where(eq(walletTransactions.id, transactionId));

      await tx.insert(notifications).values({
        userId: transaction.userId,
        type: 'TRANSACTION_REJECTED',
        title: 'Transaction Rejected',
        message: `Your ${transaction.type.toLowerCase()} of $${amount.toFixed(2)} was rejected. Reason: ${reason}`,
      });

      await tx.insert(auditLogs).values({
        userId: adminId,
        action: 'REJECT_TRANSACTION',
        details: JSON.stringify({ transactionId, type: transaction.type, amount: transaction.amount, reason })
      });

      return { success: true };
    });
  }

  async adminAdjustBalance(userId: string, adminId: string, type: 'CREDIT' | 'DEBIT', amountStr: string, reason: string) {
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

    return await db.transaction(async (tx) => {
      const wallet = await tx.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
      });
      if (!wallet) throw new Error('Wallet not found');

      let newBalance = Number(wallet.balance);
      let newAvailable = Number(wallet.availableBalance);
      
      if (type === 'DEBIT' && newAvailable < amount) {
        throw new Error('Insufficient available balance for debit');
      }

      if (type === 'CREDIT') {
        newBalance += amount;
        newAvailable += amount;
      } else {
        newBalance -= amount;
        newAvailable -= amount;
      }

      await tx.update(wallets)
        .set({ balance: newBalance.toString(), availableBalance: newAvailable.toString(), updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));

      await tx.insert(walletTransactions).values({
        userId: userId,
        walletId: wallet.id,
        type: 'ADMIN_ADJUSTMENT',
        amount: (type === 'DEBIT' ? -amount : amount).toString(),
        balanceBefore: wallet.balance,
        balanceAfter: newBalance.toString(),
        status: 'COMPLETED',
        referenceId: reason
      });

      await tx.insert(auditLogs).values({
        userId: adminId,
        action: 'ADMIN_BALANCE_ADJUSTMENT',
        details: JSON.stringify({ targetUserId: userId, type, amount, reason, newBalance })
      });
      
      await tx.insert(notifications).values({
        userId: userId,
        type: 'ADMIN_MESSAGE',
        title: 'Balance Adjustment',
        message: `Your balance was ${type === 'CREDIT' ? 'credited' : 'debited'} by $${amount}. Reason: ${reason}`,
      });

      return { success: true, newBalance };
    });
  }

}
export const walletService = new WalletService();
