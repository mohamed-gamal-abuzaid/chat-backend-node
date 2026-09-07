import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuth';
import { ChatService } from '../services/chat.service';
import { db } from '../db';
import { users } from '../db/models/users';
import { eq } from 'drizzle-orm';

const chatService = new ChatService();

export const setupSocketIO = (io: Server) => {
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;

    if (!userId) {
      return socket.disconnect();
    }

    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);

    // 1. تحديث حالة المستخدم إلى Online وإبلاغ باقي المستخدمين
    try {
      await db.update(users).set({ isOnline: true }).where(eq(users.id, userId));
      socket.broadcast.emit('user_status_changed', {
        userId,
        isOnline: true,
      });
    } catch (err) {
      console.error('Error updating user online status:', err);
    }

    // انضمام المستخدم لغرفة خاصة بـ ID حسابه لتلقي الرسائل والإشعارات الفردية
    socket.join(`user_${userId}`);

    // الانضمام لغرفة مجموعة (مع معالجة الـ JSON)
    socket.on('join_group', (rawData: any) => {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const groupId = typeof data === 'object' ? data.groupId : data;

      if (!groupId) return;

      socket.join(`group_${groupId}`);
      console.log(`User ${userId} joined group_${groupId}`);
    });

    // إرسال رسالة خاصة (1-on-1) - تدعم النص والوسائط
    socket.on('send_private_message', async (rawData: any) => {
      try {
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const { receiverId, content, mediaUrl, type } = data;

        if (!receiverId || (!content && !mediaUrl)) {
          return socket.emit('error', { message: 'receiverId and (content or mediaUrl) are required' });
        }

        const msg = await chatService.sendMessage(userId, content || '', receiverId, undefined, mediaUrl, type);

        // إرسال الرسالة للطرفين في الوقت الفعلي
        io.to(`user_${receiverId}`).to(`user_${userId}`).emit('new_private_message', msg);

        // إرسال إشعار للمستلم
        io.to(`user_${receiverId}`).emit('new_notification', {
          content: `New private message from User ${userId}`,
          createdAt: new Date(),
        });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // إرسال رسالة داخل جروب - تدعم النص والوسائط
    socket.on('send_group_message', async (rawData: any) => {
      try {
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const { groupId, content, mediaUrl, type } = data;

        if (!groupId || (!content && !mediaUrl)) {
          return socket.emit('error', { message: 'groupId and (content or mediaUrl) are required' });
        }

        const msg = await chatService.sendMessage(userId, content || '', undefined, groupId, mediaUrl, type);

        // إرسال الرسالة لكل الأعضاء في غرفة المجموعة
        io.to(`group_${groupId}`).emit('new_group_message', msg);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // ==========================================
    // 1. حدث استلام الرسالة (Delivered)
    // ==========================================
    socket.on('message_delivered', async (rawData: any) => {
      try {
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const { messageId, senderId } = data;

        const updatedMsg = await chatService.markAsDelivered(messageId);

        io.to(`user_${senderId}`).emit('message_status_updated', {
          messageId: updatedMsg.id,
          status: 'delivered',
          deliveredAt: updatedMsg.deliveredAt,
        });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // ==========================================
    // 2. حدث قراءة الرسالة (Seen / Read)
    // ==========================================
    socket.on('message_read', async (rawData: any) => {
      try {
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const { messageId, senderId } = data;

        const updatedMsg = await chatService.markAsRead(messageId);

        io.to(`user_${senderId}`).emit('message_status_updated', {
          messageId: updatedMsg.id,
          status: 'read',
          readAt: updatedMsg.readAt,
        });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // ==========================================
    // 3. حدث قطع الاتصال (Offline Status)
    // ==========================================
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      const lastSeen = new Date();

      try {
        await db.update(users).set({ isOnline: false, lastSeen }).where(eq(users.id, userId));

        socket.broadcast.emit('user_status_changed', {
          userId,
          isOnline: false,
          lastSeen,
        });
      } catch (err) {
        console.error('Error updating user offline status:', err);
      }
    });

    // ==========================================
    // 4. مؤشر بداية الكتابة (Typing Started)
    // ==========================================
    socket.on('typing', (rawData: any) => {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { receiverId, groupId } = data;

      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('user_typing', { userId });
      } else if (groupId) {
        socket.to(`group_${groupId}`).emit('user_typing', { userId, groupId });
      }
    });

    // ==========================================
    // 5. مؤشر توقف الكتابة (Typing Stopped)
    // ==========================================
    socket.on('stop_typing', (rawData: any) => {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { receiverId, groupId } = data;

      if (receiverId) {
        socket.to(`user_${receiverId}`).emit('user_stopped_typing', { userId });
      } else if (groupId) {
        socket.to(`group_${groupId}`).emit('user_stopped_typing', { userId, groupId });
      }
    });
  });
};