import { hasDatabase } from '../../db/index';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

export class StatisticsRepository {
  async getLeaderboard(period: string, sortBy: string, limit: number, offset: number) {
    if (!hasDatabase()) return { data: [], total: 0 };

    let dateFilter = sql`1=1`;
    const now = new Date();
    
    if (period === 'daily') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      dateFilter = sql`completed_at >= ${startOfDay}::timestamp`;
    } else if (period === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0);
      dateFilter = sql`completed_at >= ${new Date(startOfWeek).toISOString()}::timestamp`;
    } else if (period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      dateFilter = sql`completed_at >= ${startOfMonth}::timestamp`;
    }

    let orderBy = sql`earnings DESC, wins DESC, total_matches DESC`;
    if (sortBy === 'wins') {
      orderBy = sql`wins DESC, earnings DESC, total_matches DESC`;
    } else if (sortBy === 'matches') {
      orderBy = sql`total_matches DESC, earnings DESC, wins DESC`;
    } else if (sortBy === 'win_rate') {
      orderBy = sql`win_rate DESC, wins DESC, earnings DESC`;
    }

    const query = sql`
      WITH winner_stats AS (
        SELECT winner_id, COUNT(*) as wins, SUM(prize_amount) as earnings
        FROM settlements
        WHERE status = 'COMPLETED' AND ${dateFilter}
        GROUP BY winner_id
      ),
      loser_stats AS (
        SELECT loser_id, COUNT(*) as losses
        FROM settlements
        WHERE status = 'COMPLETED' AND ${dateFilter}
        GROUP BY loser_id
      ),
      combined_stats AS (
        SELECT
          u.id as user_id,
          u.username,
          u.avatar,
          COALESCE(w.wins, 0)::int as wins,
          COALESCE(l.losses, 0)::int as losses,
          (COALESCE(w.wins, 0) + COALESCE(l.losses, 0))::int as total_matches,
          COALESCE(w.earnings, 0)::numeric as earnings
        FROM users u
        LEFT JOIN winner_stats w ON u.id = w.winner_id
        LEFT JOIN loser_stats l ON u.id = l.loser_id
        WHERE COALESCE(w.wins, 0) > 0 OR COALESCE(l.losses, 0) > 0
      )
      SELECT 
        *,
        CASE 
          WHEN total_matches > 0 THEN (wins::numeric / total_matches) * 100 
          ELSE 0 
        END as win_rate
      FROM combined_stats
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = sql`
      WITH winner_stats AS (
        SELECT winner_id, COUNT(*) as wins
        FROM settlements
        WHERE status = 'COMPLETED' AND ${dateFilter}
        GROUP BY winner_id
      ),
      loser_stats AS (
        SELECT loser_id, COUNT(*) as losses
        FROM settlements
        WHERE status = 'COMPLETED' AND ${dateFilter}
        GROUP BY loser_id
      )
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN winner_stats w ON u.id = w.winner_id
      LEFT JOIN loser_stats l ON u.id = l.loser_id
      WHERE COALESCE(w.wins, 0) > 0 OR COALESCE(l.losses, 0) > 0
    `;

    const [data, countResult]: any = await Promise.all([
      db.execute(query),
      db.execute(countQuery)
    ]);

    const total = countResult.length > 0 ? Number((countResult[0] as any).total) : 0;
    
    return {
      data: data.map((row: any) => ({
        userId: row.user_id,
        username: row.username,
        avatar: row.avatar,
        wins: Number(row.wins),
        losses: Number(row.losses),
        totalMatches: Number(row.total_matches),
        earnings: String(row.earnings),
        winRate: Number(row.win_rate)
      })),
      total
    };
  }

  async getUserStatistics(userId: string) {
    if (!hasDatabase()) return null;

    const query = sql`
      WITH winner_stats AS (
        SELECT winner_id, COUNT(*) as wins, SUM(prize_amount) as earnings
        FROM settlements
        WHERE status = 'COMPLETED' AND winner_id = ${userId}
        GROUP BY winner_id
      ),
      loser_stats AS (
        SELECT loser_id, COUNT(*) as losses
        FROM settlements
        WHERE status = 'COMPLETED' AND loser_id = ${userId}
        GROUP BY loser_id
      ),
      all_users_stats AS (
        SELECT
          winner_id as id, SUM(prize_amount) as earnings
        FROM settlements
        WHERE status = 'COMPLETED'
        GROUP BY winner_id
      )
      SELECT 
        COALESCE(w.wins, 0)::int as wins,
        COALESCE(l.losses, 0)::int as losses,
        (COALESCE(w.wins, 0) + COALESCE(l.losses, 0))::int as total_matches,
        COALESCE(w.earnings, 0)::numeric as earnings,
        (
          SELECT COUNT(*) + 1 
          FROM all_users_stats 
          WHERE earnings > COALESCE(w.earnings, 0)
        ) as rank
      FROM (SELECT ${userId}::uuid as id) u
      LEFT JOIN winner_stats w ON w.winner_id = u.id
      LEFT JOIN loser_stats l ON l.loser_id = u.id
    `;

    const result: any = await db.execute(query);
    if (result.length === 0) return null;

    const row = result[0] as any;
    const wins = Number(row.wins);
    const totalMatches = Number(row.total_matches);
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      wins,
      losses: Number(row.losses),
      totalMatches,
      earnings: String(row.earnings),
      winRate,
      rank: Number(row.rank)
    };
  }
}

export const statisticsRepository = new StatisticsRepository();
