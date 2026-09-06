import { db } from '../config/db';

import { eq, and } from 'drizzle-orm';
import { groupMembers } from '../db/models/groupMembers';
import { groups } from '../db/models/groups';
import { messages } from '../db/models/messages';
import { notifications } from '../db/models/notifications';

export class ChatService {

  async createGroup(name: string, adminId: number) {
    const [newGroup] = await db.insert(groups).values({ name, createdBy: adminId }).returning();
    
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: adminId,
      role: 'admin',
    });

    return newGroup;
  }

  // إضافة عضو جديد للجروب بواسطة الأدمن
  async addMemberToGroup(adminId: number, groupId: number, newMemberId: number) {
    const [isAdmin] = await db.select().from(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, adminId), eq(groupMembers.role, 'admin'))
    );

    if (!isAdmin) throw new Error('Only admins can add members');

    await db.insert(groupMembers).values({ groupId, userId: newMemberId, role: 'member' });
    
    // إنشاء إشعار للمستخدم المضاف
    await db.insert(notifications).values({
      userId: newMemberId,
      content: `You were added to group ${groupId}`,
    });
  }

  // إرسال رسالة فردية أو جماعية مع إنشاء Notification
  async sendMessage(senderId: number, content: string, receiverId?: number, groupId?: number) {
    const [msg] = await db.insert(messages).values({ senderId, content, receiverId, groupId }).returning();

    if (receiverId) {
      await db.insert(notifications).values({
        userId: receiverId,
        content: `New private message from User ${senderId}`,
      });
    }

    return msg;
  }
}