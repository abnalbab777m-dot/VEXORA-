import { pgTable, text, timestamp, integer, boolean, uuid, decimal, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('USER'), // USER or ADMIN
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, BANNED, FROZEN
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  lockedBalance: decimal('locked_balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalDeposits: decimal('total_deposits', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalWithdrawals: decimal('total_withdrawals', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalWinnings: decimal('total_winnings', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalLosses: decimal('total_losses', { precision: 12, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(), // acts as transactionId
  userId: uuid('user_id').references(() => users.id).notNull(),
  walletId: uuid('wallet_id').references(() => wallets.id).notNull(),
  type: text('type').notNull(), // DEPOSIT, WITHDRAW, MATCH_ENTRY, MATCH_LOCK, MATCH_RELEASE, PRIZE, REFUND, ADMIN_ADJUSTMENT
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, COMPLETED, FAILED, CANCELLED
  referenceId: text('reference_id'),
  metadata: jsonb('metadata'), // To store payment method info, proof, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // BANK, CRYPTO, E_WALLET
  details: jsonb('details').notNull(), 
  isActive: boolean('is_active').default(true).notNull(),
  isDepositEnabled: boolean('is_deposit_enabled').default(true).notNull(),
  isWithdrawalEnabled: boolean('is_withdrawal_enabled').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // eFootball, Jawaker
  slug: text('slug').notNull().unique(), // efootball, jawaker
  description: text('description').notNull().default(''),
  imageUrl: text('image_url'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
  isMatchmakingEnabled: boolean('is_matchmaking_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const gameStakes = pgTable('game_stakes', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique().on(t.gameId, t.amount)
]);

export const matchmakingQueue = pgTable('matchmaking_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  gameId: uuid('game_id').references(() => games.id).notNull(),
  stakeId: uuid('stake_id').references(() => gameStakes.id).notNull(),
  stakeAmount: decimal('stake_amount', { precision: 12, scale: 2 }).notNull(),
  region: text('region'),
  status: text('status').notNull().default('WAITING'), // WAITING, MATCHED, CANCELLED, EXPIRED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  matchedAt: timestamp('matched_at'),
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id).notNull(),
  player1Id: uuid('player1_id').references(() => users.id).notNull(),
  player2Id: uuid('player2_id').references(() => users.id).notNull(),
  stakeAmount: decimal('stake_amount', { precision: 12, scale: 2 }).notNull(),
  prize: decimal('prize', { precision: 12, scale: 2 }).notNull(),
  commission: decimal('commission', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, READY, LIVE, RESULT_SUBMITTED, UNDER_REVIEW, COMPLETED, CANCELLED, DISPUTED
  roomCode: text('room_code'),
  winnerId: uuid('winner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
});

export const matchResults = pgTable('match_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id).notNull().unique(),
  winnerId: uuid('winner_id').references(() => users.id).notNull(),
  score: text('score').notNull(),
  evidenceUrl: text('evidence_url'),
  submittedBy: uuid('submitted_by').references(() => users.id).notNull(),
  status: text('status').notNull(), // PLAYER_1_SUBMITTED, PLAYER_2_SUBMITTED, BOTH_CONFIRMED, DISPUTED, ADMIN_REVIEW
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id).notNull().unique(),
  winnerId: uuid('winner_id').references(() => users.id).notNull(),
  loserId: uuid('loser_id').references(() => users.id).notNull(),
  totalStake: decimal('total_stake', { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }).notNull(),
  prizeAmount: decimal('prize_amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id).notNull(),
  raisedById: uuid('raised_by_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('OPEN'), // OPEN, RESOLVED
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), // PROFILE_UPDATE, PASSWORD_CHANGE, LOGOUT
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships for ORM ease of use
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  auditLogs: many(auditLogs),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  user1Id: uuid('user1_id').references(() => users.id).notNull(),
  user2Id: uuid('user2_id').references(() => users.id).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, ACCEPTED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique().on(t.user1Id, t.user2Id)
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // FRIEND_REQUEST, MATCH_INVITE, DEPOSIT_APPROVED, DEPOSIT_REJECTED, ADMIN_MESSAGE
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  metadata: text('metadata'), // JSON string for extra data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gameInvitations = pgTable('game_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  gameId: uuid('game_id').references(() => games.id).notNull(),
  stakeId: uuid('stake_id').references(() => gameStakes.id).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, ACCEPTED, REJECTED, EXPIRED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
