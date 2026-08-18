import fs from 'fs';

let content = fs.readFileSync('src/backend/repositories/adminRepository.ts', 'utf-8');

const badBlock = `    const [stats] = (await db.execute(sql\`
      WITH winner_stats AS (
        SELECT COUNT(*)).rows as wins FROM settlements WHERE winner_id = \${userId} AND status = 'COMPLETED'
      ).then(res => res.rows),
      loser_stats AS (
        SELECT COUNT(*) as losses FROM settlements WHERE loser_id = \${userId} AND status = 'COMPLETED'
      )
      SELECT 
        COALESCE((SELECT wins FROM winner_stats), 0) as wins,
        COALESCE((SELECT losses FROM loser_stats), 0) as losses
    \`);`;

const goodBlock = `    const statsRes = await db.execute(sql\`
      WITH winner_stats AS (
        SELECT COUNT(*) as wins FROM settlements WHERE winner_id = \${userId} AND status = 'COMPLETED'
      ),
      loser_stats AS (
        SELECT COUNT(*) as losses FROM settlements WHERE loser_id = \${userId} AND status = 'COMPLETED'
      )
      SELECT 
        COALESCE((SELECT wins FROM winner_stats), 0) as wins,
        COALESCE((SELECT losses FROM loser_stats), 0) as losses
    \`);
    const stats = statsRes.rows[0];`;

content = content.replace(badBlock, goodBlock);

const badBlock2 = `    const [userStats, matchStats, txStats, disputeStats, commStats] = await Promise.all([
      (await db.execute(sql\`SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN status = 'BANNED' THEN 1 ELSE 0 END) as banned
        FROM users\`)).rows,
      (await db.execute(sql\`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('PENDING', 'READY', 'LIVE', 'RESULT_SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM matches\`)).rows,
      (await db.execute(sql\`SELECT 
        SUM(CASE WHEN type = 'DEPOSIT' AND status = 'COMPLETED' THEN amount ELSE 0 END) as deposits,
        SUM(CASE WHEN type = 'WITHDRAW' AND status = 'COMPLETED' THEN amount ELSE 0 END) as withdrawals
        FROM wallet_transactions\`)).rows,
      (await db.execute(sql\`SELECT COUNT(*) as total FROM disputes WHERE status = 'OPEN'\`)).rows,
      (await db.execute(sql\`SELECT 
        SUM(amount) as total
        FROM wallet_transactions WHERE type = 'COMMISSION' AND status = 'COMPLETED'\`)).rows
    ]);`;

// Need to just manually fetch the files and rewrite the execute wrappers.
// Actually, I can just revert the files and rewrite them carefully.
