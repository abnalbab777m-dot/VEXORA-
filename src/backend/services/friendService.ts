import { db } from '../../db';
import { friendships, users, notifications } from '../../db/schema';
import { eq, or, and, ne } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class FriendService {
  async sendRequest(senderId: string, receiverUsername: string) {
    const receiver = await db.query.users.findFirst({
      where: eq(users.username, receiverUsername),
    });
    if (!receiver) throw new Error('User not found');
    if (receiver.id === senderId) throw new Error('Cannot send friend request to yourself');

    const existing = await db.query.friendships.findFirst({
      where: or(
        and(eq(friendships.user1Id, senderId), eq(friendships.user2Id, receiver.id)),
        and(eq(friendships.user1Id, receiver.id), eq(friendships.user2Id, senderId))
      ),
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') throw new Error('Already friends');
      throw new Error('Friend request already exists');
    }

    await db.transaction(async (tx) => {
      await tx.insert(friendships).values({
        user1Id: senderId,
        user2Id: receiver.id,
        status: 'PENDING',
      });

      const sender = await tx.query.users.findFirst({ where: eq(users.id, senderId) });
      
      await tx.insert(notifications).values({
        userId: receiver.id,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: `${sender?.username} sent you a friend request.`,
        metadata: JSON.stringify({ senderId }),
      });
    });

    return { success: true };
  }

  async respondToRequest(userId: string, senderId: string, accept: boolean) {
    const request = await db.query.friendships.findFirst({
      where: and(eq(friendships.user1Id, senderId), eq(friendships.user2Id, userId), eq(friendships.status, 'PENDING')),
    });
    if (!request) throw new Error('Friend request not found');

    await db.transaction(async (tx) => {
      if (accept) {
        await tx.update(friendships)
          .set({ status: 'ACCEPTED', updatedAt: new Date() })
          .where(eq(friendships.id, request.id));
          
        const receiver = await tx.query.users.findFirst({ where: eq(users.id, userId) });
        await tx.insert(notifications).values({
          userId: senderId,
          type: 'FRIEND_ACCEPTED',
          title: 'Friend Request Accepted',
          message: `${receiver?.username} accepted your friend request.`,
        });
      } else {
        await tx.delete(friendships).where(eq(friendships.id, request.id));
      }
    });

    return { success: true };
  }

  async removeFriend(userId: string, friendId: string) {
    await db.delete(friendships).where(
      or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, friendId)),
        and(eq(friendships.user1Id, friendId), eq(friendships.user2Id, userId))
      )
    );
    return { success: true };
  }

  async getFriends(userId: string) {
    const rows = await db.query.friendships.findMany({
      where: and(
        or(eq(friendships.user1Id, userId), eq(friendships.user2Id, userId)),
        eq(friendships.status, 'ACCEPTED')
      ),
    });
    
    const friendIds = rows.map(r => r.user1Id === userId ? r.user2Id : r.user1Id);
    if (friendIds.length === 0) return [];

    const friendsList = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, friendIds),
      columns: { id: true, username: true, avatar: true, status: true },
    });
    return friendsList;
  }

  async getPendingRequests(userId: string) {
    const rows = await db.query.friendships.findMany({
      where: and(eq(friendships.user2Id, userId), eq(friendships.status, 'PENDING')),
    });
    
    const senderIds = rows.map(r => r.user1Id);
    if (senderIds.length === 0) return [];

    const senders = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, senderIds),
      columns: { id: true, username: true, avatar: true },
    });
    return senders;
  }
}

export const friendService = new FriendService();
