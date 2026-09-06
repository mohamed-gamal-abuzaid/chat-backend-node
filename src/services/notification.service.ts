import { db } from '../config/db';
import { notifications } from '../db/models/notifications';
import { eq } from 'drizzle-orm';

export class NotificationService {

    
  async getUserNotifications(userId: number) {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async markAsRead(notificationId: number) {
    return await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
  }
}