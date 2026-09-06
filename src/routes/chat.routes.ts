import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();
const controller = new ChatController();

router.use(authenticateJWT);

/**
 * @openapi
 * /api/chat/groups:
 *   post:
 *     summary: Create a new group (Creator becomes Admin)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Group created }
 */
router.post('/groups', (req, res) => controller.createGroup(req, res));

/**
 * @openapi
 * /api/chat/groups/{groupId}/members:
 *   post:
 *     summary: Add a member to group (Group Admin only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       200: { description: Member added }
 */
router.post('/groups/:groupId/members', (req, res) => controller.addMember(req, res));

/**
 * @openapi
 * /api/chat/messages:
 *   post:
 *     summary: Send direct message (1-on-1) or group message
 *     security: [{ bearerAuth: [] }]
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               receiverId: { type: integer }
 *               groupId: { type: integer }
 *     responses:
 *       201: { description: Message sent }
 */
router.post('/messages', (req, res) => controller.sendMessage(req, res));

export default router;