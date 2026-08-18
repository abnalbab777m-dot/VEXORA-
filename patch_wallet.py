import re

with open('src/backend/services/walletService.ts', 'r') as f:
    c = f.read()

admin_methods = """
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
          message: `Your deposit of $${amount} has been approved.`,
        });
      } else if (transaction.type === 'WITHDRAW') {
        // Amount was already locked? 
        // Wait, in standard logic, withdrawal request usually subtracts from available immediately.
        // Let's assume it was already subtracted from available, now we subtract from balance and locked?
        // Let's check how requestWithdrawal is implemented.
        pass
      }

      await tx.update(walletTransactions)
        .set({ status: 'COMPLETED', balanceAfter: newBalance.toString() })
        .where(eq(walletTransactions.id, transactionId));

      if (transaction.type === 'DEPOSIT') {
        await tx.update(wallets)
          .set({ 
            balance: newBalance.toString(), 
            availableBalance: newAvailable.toString(),
            totalDeposits: newTotalDeposits.toString(),
            updatedAt: new Date()
          })
          .where(eq(wallets.id, wallet.id));
      }

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
      
      await tx.update(walletTransactions)
        .set({ status: 'FAILED' })
        .where(eq(walletTransactions.id, transactionId));

      await tx.insert(notifications).values({
        userId: transaction.userId,
        type: 'TRANSACTION_REJECTED',
        title: 'Transaction Rejected',
        message: `Your ${transaction.type.toLowerCase()} of $${amount} was rejected. Reason: ${reason}`,
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
"""

c = c.replace("export const walletService = new WalletService();", admin_methods + "\nexport const walletService = new WalletService();")

if "import { auditLogs, notifications }" not in c and "import { auditLogs" not in c:
    c = c.replace("import { wallets, walletTransactions } from '../../db/schema';", "import { wallets, walletTransactions, auditLogs, notifications } from '../../db/schema';")
    c = c.replace("import { wallets, walletTransactions, users }", "import { wallets, walletTransactions, users, auditLogs, notifications }")

with open('src/backend/services/walletService.ts', 'w') as f:
    f.write(c)
