import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export class ChatController {


    
  async createGroup(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user!.id;
      const { name } = req.body;
      const group = await chatService.createGroup(name, adminId);
      res.status(201).json({ message: 'Group created successfully', group });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async addMember(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user!.id;
      const groupIdParam = req.params.groupId;
      const groupId = parseInt(Array.isArray(groupIdParam) ? groupIdParam[0] : groupIdParam, 10);
      const { userId } = req.body;
      await chatService.addMemberToGroup(adminId, groupId, userId);
      res.json({ message: 'Member added to group successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const senderId = req.user!.id;
      const { content, receiverId, groupId } = req.body;
      const msg = await chatService.sendMessage(senderId, content, receiverId, groupId);
      res.status(201).json({ message: 'Message sent successfully', msg });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}