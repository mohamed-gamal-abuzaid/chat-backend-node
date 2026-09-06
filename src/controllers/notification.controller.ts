import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const list = await notificationService.getUserNotifications(userId);
      res.json(list);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
        10,
      );
      const updated = await notificationService.markAsRead(id);
      res.json({ message: 'Notification marked as read', updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}