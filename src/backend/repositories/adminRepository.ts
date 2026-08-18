import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { users, matches, wallets, walletTransactions, games, gameStakes, disputes, auditLogs, settlements } from '../../db/schema';
import { sql, eq, or, and, desc, like, ilike, SQL } from 'drizzle-orm';

export class AdminRepository {
  // Dashboard
  async getDashboardStats() {
    if (!hasDatabase()) return null;

    const [userStats, matchStats, txStats, disputeStats, commStats] = await Promise.all([
      db.execute(sql`SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN status = 'BANNED' THEN 1 ELSE 0 END) as banned
        FROM users`),
      db.execute(sql`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('PENDING', 'READY', 'LIVE', 'RESULT_SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM matches`),
      db.execute(sql`SELECT 
        SUM(CASE WHEN type = 'DEPOSIT' AND status = 'COMPLETED' THEN amount ELSE 0 END) as deposits,
        SUM(CASE WHEN type = 'WITHDRAW' AND status = 'COMPLETED' THEN amount ELSE 0 END) as withdrawals
        FROM wallet_transactions`),
      db.execute(sql`SELECT COUNT(*) as total FROM disputes WHERE status = 'OPEN'`),
      db.execute(sql`SELECT 
        SUM(amount) as total
        FROM wallet_transactions WHERE type = 'COMMISSION' AND status = 'COMPLETED'`)
    ]);

    return {
      users: {
        total: Number(userStats[0].total || 0),
        active: Number(userStats[0].active || 0),
        suspended: Number(userStats[0].suspended || 0),
        banned: Number(userStats[0].banned || 0)
      },
      matches: {
        total: Number(matchStats[0].total || 0),
        active: Number(matchStats[0].active || 0),
        completed: Number(matchStats[0].completed || 0),
        disputed: Number(disputeStats[0].total || 0)
      },
      financials: {
        totalDeposits: txStats[0].deposits || '0.00',
        totalWithdrawals: txStats[0].withdrawals || '0.00',
        platformCommission: commStats[0].total || '0.00'
      }
    };
  }

  // Users
  async getUsers(search: string, status: string, role: string, limit: number, offset: number) {
    if (!hasDatabase()) return { data: [], total: 0 };
    
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(or(ilike(users.username, `%${search}%`), ilike(users.email, `%${search}%`), ilike(users.id, `%${search}%`))!);
    }
    if (status && status !== 'ALL') {
      conditions.push(eq(users.status, status));
    }
    if (role && role !== 'ALL') {
      conditions.push(eq(users.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    }).from(users).where(whereClause).limit(limit).offset(offset).orderBy(desc(users.createdAt));

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    
    return { data, total: Number(countRes[0].count) };
  }

  async getUserDetail(userId: string) {
    if (!hasDatabase()) return null;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return null;

    const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    const userWallet = wallet[0] || null;

    const [stats]: any = await db.execute(sql`
      WITH winner_stats AS (
        SELECT COUNT(*) as wins FROM settlements WHERE winner_id = ${userId} AND status = 'COMPLETED'
      ),
      loser_stats AS (
        SELECT COUNT(*) as losses FROM settlements WHERE loser_id = ${userId} AND status = 'COMPLETED'
      )
      SELECT 
        COALESCE((SELECT wins FROM winner_stats), 0) as wins,
        COALESCE((SELECT losses FROM loser_stats), 0) as losses
    `);

    const wins = Number(stats?.wins || 0);
    const losses = Number(stats?.losses || 0);
    const totalMatches = wins + losses;

    return {
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        role: user[0].role,
        status: user[0].status,
        createdAt: user[0].createdAt
      },
      wallet: userWallet ? {
        balance: userWallet.balance,
        availableBalance: userWallet.availableBalance,
        lockedBalance: userWallet.lockedBalance,
        totalWinnings: userWallet.totalWinnings,
        totalLosses: userWallet.totalLosses
      } : null,
      stats: {
        wins,
        losses,
        totalMatches
      }
    };
  }

  async updateUserStatus(userId: string, newStatus: string) {
    if (!hasDatabase()) return null;
    const result = await db.update(users).set({ status: newStatus }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  // Matches
  async getMatches(search: string, status: string, limit: number, offset: number) {
    if (!hasDatabase()) return { data: [], total: 0 };
    
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(or(ilike(matches.id, `%${search}%`), ilike(matches.player1Id, `%${search}%`), ilike(matches.player2Id, `%${search}%`))!);
    }
    if (status && status !== 'ALL') {
      conditions.push(eq(matches.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
      id: matches.id,
      gameId: matches.gameId,
      player1Id: matches.player1Id,
      player2Id: matches.player2Id,
      stakeAmount: matches.stakeAmount,
      prize: matches.prize,
      status: matches.status,
      createdAt: matches.createdAt,
      finishedAt: matches.finishedAt,
    }).from(matches).where(whereClause).limit(limit).offset(offset).orderBy(desc(matches.createdAt));

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(matches).where(whereClause);
    
    return { data, total: Number(countRes[0].count) };
  }

  async getMatchDetail(matchId: string) {
    if (!hasDatabase()) return null;
    
    const m = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!m.length) return null;

    const matchInfo = m[0];
    const game = await db.select().from(games).where(eq(games.id, matchInfo.gameId)).limit(1);
    const p1 = await db.select().from(users).where(eq(users.id, matchInfo.player1Id)).limit(1);
    const p2 = await db.select().from(users).where(eq(users.id, matchInfo.player2Id)).limit(1);
    const winner = matchInfo.winnerId ? await db.select().from(users).where(eq(users.id, matchInfo.winnerId)).limit(1) : null;
    
    const settlement = await db.select().from(settlements).where(eq(settlements.matchId, matchId)).limit(1);

    return {
      match: matchInfo,
      game: game[0] || null,
      player1: p1[0] ? { id: p1[0].id, username: p1[0].username } : null,
      player2: p2[0] ? { id: p2[0].id, username: p2[0].username } : null,
      winner: winner && winner[0] ? { id: winner[0].id, username: winner[0].username } : null,
      settlement: settlement[0] || null
    };
  }

  // Transactions
  async getTransactions(search: string, type: string, startDate: string | undefined, endDate: string | undefined, limit: number, offset: number) {
    if (!hasDatabase()) return { data: [], total: 0 };
    
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(or(ilike(walletTransactions.id, `%${search}%`), ilike(walletTransactions.userId, `%${search}%`), ilike(walletTransactions.referenceId, `%${search}%`))!);
    }
    if (type && type !== 'ALL') {
      conditions.push(eq(walletTransactions.type, type));
    }
    if (startDate) {
      conditions.push(sql`${walletTransactions.createdAt} >= ${new Date(startDate).toISOString()}`);
    }
    if (endDate) {
      // Add one day to end date to make it inclusive up to the end of the day
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      conditions.push(sql`${walletTransactions.createdAt} < ${end.toISOString()}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
      id: walletTransactions.id,
      userId: walletTransactions.userId,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      balanceBefore: walletTransactions.balanceBefore,
      balanceAfter: walletTransactions.balanceAfter,
      status: walletTransactions.status,
      referenceId: walletTransactions.referenceId,
      createdAt: walletTransactions.createdAt,
    }).from(walletTransactions).where(whereClause).limit(limit).offset(offset).orderBy(desc(walletTransactions.createdAt));

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(walletTransactions).where(whereClause);
    
    return { data, total: Number(countRes[0].count) };
  }

  // Games
  async getGames() {
    if (!hasDatabase()) return [];
    const gamesList = await db.select().from(games).orderBy(games.name);
    
    const enriched = [];
    for (const game of gamesList) {
      const stakes = await db.select().from(gameStakes).where(eq(gameStakes.gameId, game.id)).orderBy(gameStakes.amount);
      enriched.push({ ...game, stakes });
    }
    return enriched;
  }

  async updateGame(gameId: string, data: Partial<typeof games.$inferInsert>) {
    if (!hasDatabase()) return null;
    const result = await db.update(games).set(data).where(eq(games.id, gameId)).returning();
    return result[0];
  }

  // Audit Logs
  async getAuditLogs(limit: number, offset: number) {
    if (!hasDatabase()) return { data: [], total: 0 };
    
    const data = await db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt));

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    
    return { data, total: Number(countRes[0].count) };
  }
}

export const adminRepository = new AdminRepository();
