import { db } from '../../db';
import { gameInvitations, users, games, gameStakes, notifications } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { matchmakingService } from './matchmakingService';

export class GameInvitationService {
  async inviteFriend(senderId: string, receiverId: string, gameId: string, stakeId: string) {
    if (senderId === receiverId) throw new Error('Cannot invite yourself');

    const receiver = await db.query.users.findFirst({ where: eq(users.id, receiverId) });
    if (!receiver) throw new Error('Receiver not found');

    const sender = await db.query.users.findFirst({ where: eq(users.id, senderId) });
    const game = await db.query.games.findFirst({ where: eq(games.id, gameId) });
    const stake = await db.query.gameStakes.findFirst({ where: eq(gameStakes.id, stakeId) });

    if (!game || !stake) throw new Error('Invalid game or stake');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const [invite] = await db.insert(gameInvitations).values({
      senderId,
      receiverId,
      gameId,
      stakeId,
      expiresAt,
    }).returning();

    await db.insert(notifications).values({
      userId: receiverId,
      type: 'MATCH_INVITE',
      title: 'Game Invitation',
      message: `${sender?.username} invited you to play ${game.name} for $${stake.amount}.`,
      metadata: JSON.stringify({ inviteId: invite.id, gameId, stakeId }),
    });

    return invite;
  }

  async respondToInvite(userId: string, inviteId: string, accept: boolean) {
    const invite = await db.query.gameInvitations.findFirst({
      where: and(eq(gameInvitations.id, inviteId), eq(gameInvitations.receiverId, userId), eq(gameInvitations.status, 'PENDING')),
    });

    if (!invite) throw new Error('Invitation not found or already processed');
    if (new Date() > invite.expiresAt) {
      await db.update(gameInvitations).set({ status: 'EXPIRED' }).where(eq(gameInvitations.id, inviteId));
      throw new Error('Invitation expired');
    }

    if (!accept) {
      await db.update(gameInvitations).set({ status: 'REJECTED' }).where(eq(gameInvitations.id, inviteId));
      const receiver = await db.query.users.findFirst({ where: eq(users.id, userId) });
      await db.insert(notifications).values({
        userId: invite.senderId,
        type: 'INVITE_REJECTED',
        title: 'Invitation Rejected',
        message: `${receiver?.username} rejected your game invitation.`,
      });
      return { success: true };
    }

    // Accept invite: transition both users directly into a match or matchmaking queue
    await db.update(gameInvitations).set({ status: 'ACCEPTED' }).where(eq(gameInvitations.id, inviteId));
    
    // Call matchmaking to match them together? We can just create a direct match.
    // Wait, creating a direct match requires wallet lock, deductions, etc. 
    // MatchmakingService.join does this, but it expects to find someone in queue.
    // Let's implement MatchmakingService.createDirectMatch(player1Id, player2Id, gameId, stakeId)
    const match = await matchmakingService.createDirectMatch(invite.senderId, invite.receiverId, invite.gameId, invite.stakeId);
    
    return { success: true, matchId: match.id };
  }
}

export const gameInvitationService = new GameInvitationService();
