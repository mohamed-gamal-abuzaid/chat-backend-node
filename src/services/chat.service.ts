import { db } from '../config/db'; 
import { eq, and, or } from 'drizzle-orm';
import { groupMembers } from '../db/models/groupMembers';
import { groups } from '../db/models/groups';
import { messages } from '../db/models/messages';
import { notifications } from '../db/models/notifications';

export class ChatService {
  
  async createGroup(name: string, adminId: number, memberIds: number[] = []) {
    const [newGroup] = await db.insert(groups).values({ name, createdBy: adminId }).returning();


    const allMembers = Array.from(new Set([adminId, ...memberIds]));
    const memberRecords = allMembers.map((userId) => ({
      groupId: newGroup.id,
      userId,
      role: userId === adminId ? 'admin' : 'member',
    }));

    await db.insert(groupMembers).values(memberRecords);
    return newGroup;
  }


  async addMemberToGroup(adminId: number, groupId: number, newMemberId: number) {
    const [isAdmin] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, adminId), eq(groupMembers.role, 'admin')));

    if (!isAdmin) throw new Error('Only admins can add members');

    await db.insert(groupMembers).values({ groupId, userId: newMemberId, role: 'member' });

    await db.insert(notifications).values({
      userId: newMemberId,
      content: `You were added to group ${groupId}`,
    });
  }


  async sendMessage(
    senderId: number,
    content: string,
    receiverId?: number,
    groupId?: number,
    mediaUrl?: string,
    type: 'text' | 'image' | 'file' | 'audio' = 'text'
  ) {
    const [msg] = await db
      .insert(messages)
      .values({
        senderId,
        content,
        receiverId,
        groupId,
        mediaUrl,
        type,
      })
      .returning();

    if (receiverId) {
      await db.insert(notifications).values({
        userId: receiverId,
        content: `New private message from User ${senderId}`,
      });
    }

    return msg;
  }


  async getPrivateMessages(userId1: number, userId2: number) {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      );
  }

  async getGroupMessages(groupId: number) {
    return await db.select().from(messages).where(eq(messages.groupId, groupId));
  }


  async markAsDelivered(messageId: number) {
    const [updated] = await db
      .update(messages)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();
    return updated;
  }


  async markAsRead(messageId: number) {
    const [updated] = await db
      .update(messages)
      .set({ status: 'read', readAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();
    return updated;
  }
}