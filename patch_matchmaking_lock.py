import re

with open('src/backend/services/matchmakingService.ts', 'r') as f:
    c = f.read()

bad_lock = """      // Lock wallets
      await walletService.lockBalanceTx(player1Id, stakeAmount, 'MATCH_LOCK', tx);
      await walletService.lockBalanceTx(player2Id, stakeAmount, 'MATCH_LOCK', tx);"""

good_lock = """      // Lock wallets
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
"""

c = c.replace(bad_lock, good_lock)

if "import { wallets, walletTransactions" not in c:
    c = c.replace("import { matches } from '../../db/schema';", "import { matches, wallets, walletTransactions } from '../../db/schema';")

with open('src/backend/services/matchmakingService.ts', 'w') as f:
    f.write(c)
