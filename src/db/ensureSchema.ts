import fs from 'fs';
import path from 'path';
import { db, hasDatabase } from './index';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function ensureDatabaseSchema() {
  if (!hasDatabase()) {
    console.log('[DB] No database configured, skipping schema ensure.');
    return;
  }

  try {
    console.log('[DB] Checking and ensuring database schema & migrations...');

    // 1. Ensure basic tables exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        username text NOT NULL UNIQUE,
        game_username text DEFAULT '' NOT NULL,
        efootball_username text DEFAULT '' NOT NULL,
        jawaker_username text DEFAULT '' NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text DEFAULT 'USER' NOT NULL,
        status text DEFAULT 'ACTIVE' NOT NULL,
        avatar text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wallets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance numeric(12, 2) DEFAULT 0.00 NOT NULL,
        available_balance numeric(12, 2) DEFAULT 0.00 NOT NULL,
        locked_balance numeric(12, 2) DEFAULT 0.00 NOT NULL,
        total_deposits numeric(12, 2) DEFAULT 0.00 NOT NULL,
        total_withdrawals numeric(12, 2) DEFAULT 0.00 NOT NULL,
        total_winnings numeric(12, 2) DEFAULT 0.00 NOT NULL,
        total_losses numeric(12, 2) DEFAULT 0.00 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        type text NOT NULL,
        amount numeric(12, 2) NOT NULL,
        balance_before numeric(12, 2) NOT NULL,
        balance_after numeric(12, 2) NOT NULL,
        status text DEFAULT 'PENDING' NOT NULL,
        reference_id text,
        metadata jsonb,
        created_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS games (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text DEFAULT '' NOT NULL,
        image_url text,
        status text DEFAULT 'ACTIVE' NOT NULL,
        is_matchmaking_enabled boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS game_stakes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        amount numeric(12, 2) NOT NULL,
        currency text DEFAULT 'USD' NOT NULL,
        status text DEFAULT 'ACTIVE' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        CONSTRAINT game_stakes_game_id_amount_unique UNIQUE(game_id, amount)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        stake_id uuid NOT NULL REFERENCES game_stakes(id) ON DELETE CASCADE,
        player1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        player2_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        winner_id uuid REFERENCES users(id) ON DELETE SET NULL,
        status text DEFAULT 'PENDING' NOT NULL,
        stake_amount numeric(12, 2) NOT NULL,
        prize_pool numeric(12, 2) NOT NULL,
        platform_fee numeric(12, 2) NOT NULL,
        room_code text,
        host_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        host_timer_expires_at timestamp,
        host_attempts integer DEFAULT 1 NOT NULL,
        tournament_id uuid,
        round text DEFAULT 'FINAL',
        match_number integer,
        started_at timestamp,
        completed_at timestamp,
        cancelled_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS match_results (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        match_id uuid NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
        winner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score text NOT NULL,
        evidence_url text,
        submitted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS disputes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        raised_by_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason text NOT NULL,
        status text DEFAULT 'OPEN' NOT NULL,
        resolution text,
        created_at timestamp DEFAULT now() NOT NULL,
        resolved_at timestamp
      );

      CREATE TABLE IF NOT EXISTS payment_methods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        name text NOT NULL,
        type text NOT NULL,
        details jsonb NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        is_deposit_enabled boolean DEFAULT true NOT NULL,
        is_withdrawal_enabled boolean DEFAULT true NOT NULL,
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
        expires_at timestamp NOT NULL
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

      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        action text NOT NULL,
        details text,
        ip_address text,
        created_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Safely apply column additions on existing tables
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS game_username text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS efootball_username text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS jawaker_username text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER';

      ALTER TABLE matches ADD COLUMN IF NOT EXISTS host_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS host_timer_expires_at timestamp;
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS host_attempts integer NOT NULL DEFAULT 1;
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS room_code text;
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS round text DEFAULT 'FINAL';
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id uuid;
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_number integer;

      ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_deposit_enabled boolean NOT NULL DEFAULT true;
      ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_withdrawal_enabled boolean NOT NULL DEFAULT true;
      ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

      ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS metadata jsonb;
      ALTER TABLE game_invitations ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES matches(id) ON DELETE SET NULL;
    `);

    // 3. Seed Default Admin & Games if not present
    const adminCheck = await db.execute(sql`SELECT id FROM users WHERE email = 'admin@vexora.com' LIMIT 1;`);
    const adminRows = (adminCheck as any).rows || adminCheck;
    if (!adminRows || adminRows.length === 0) {
      const passwordHash = await bcrypt.hash('VexoraAdmin!2026', 10);
      await db.execute(sql`
        INSERT INTO users (username, email, password_hash, role, status, game_username, efootball_username, jawaker_username)
        VALUES ('VexoraAdmin', 'admin@vexora.com', ${passwordHash}, 'ADMIN', 'ACTIVE', 'Admin', 'AdminEF', 'AdminJW')
        ON CONFLICT (email) DO NOTHING;
      `);
      console.log('[DB] Created default admin: admin@vexora.com');
    }

    // Seed Games
    await db.execute(sql`
      INSERT INTO games (name, slug, description, image_url, status, is_matchmaking_enabled)
      VALUES 
      ('eFootball', 'efootball', 'The premier virtual football experience. Test your skills in 1v1 matches.', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop', 'ACTIVE', true),
      ('Jawaker / جواكر', 'jawaker', 'The ultimate destination for Arabic card games like Tarneeb, Trix, and Baloot.', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=2187&auto=format&fit=crop', 'ACTIVE', true)
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed Stakes for Games
    await db.execute(sql`
      INSERT INTO game_stakes (game_id, amount, currency, status)
      SELECT g.id, s.amount, 'USD', 'ACTIVE'
      FROM games g
      CROSS JOIN (VALUES (1.00), (2.50), (5.00), (10.00), (20.00), (50.00), (100.00)) AS s(amount)
      ON CONFLICT (game_id, amount) DO NOTHING;
    `);

    console.log('[DB] Schema and initial data verified successfully.');
  } catch (error) {
    console.error('[DB] Error verifying schema:', error);
  }
}
