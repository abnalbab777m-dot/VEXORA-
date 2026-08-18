import fs from 'fs';
import path from 'path';
import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

export async function initDevDb() {
  if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
    try {
      const res = await db.execute(sql`SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'users');`);
      if (res[0] && !res[0].exists) {
        console.log("Initializing dev database...");
        const migrationSql = fs.readFileSync(path.join(process.cwd(), 'drizzle/0000_safe_enchantress.sql'), 'utf8');
        const stmts = migrationSql.split('--> statement-breakpoint');
        for (const stmt of stmts) {
            if (stmt.trim()) await db.execute(sql.raw(stmt.trim()));
        }
        
        await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          name text NOT NULL,
          type text NOT NULL,
          details jsonb NOT NULL,
          is_active boolean DEFAULT true NOT NULL,
          display_order integer DEFAULT 0 NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS friendships (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user2_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status text DEFAULT 'PENDING' NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL,
          CONSTRAINT friendships_unique_users UNIQUE(user1_id, user2_id)
        );
        CREATE TABLE IF NOT EXISTS game_invitations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          stake_id uuid NOT NULL REFERENCES game_stakes(id) ON DELETE CASCADE,
          match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
          status text DEFAULT 'PENDING' NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notifications (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type text NOT NULL,
          title text NOT NULL,
          message text NOT NULL,
          read boolean DEFAULT false NOT NULL,
          metadata jsonb,
          created_at timestamp DEFAULT now() NOT NULL
        );
        `);
        console.log("Dev db initialized!");
        
        require('child_process').execSync('npx tsx src/db/seedGames.ts && npx tsx src/db/seedPaymentMethods.ts && npx tsx src/db/seedAdminAndStakes.ts', { stdio: 'inherit' });
      }
    } catch(e) {
      console.error("Init dev db error:", e);
    }
  }
}
