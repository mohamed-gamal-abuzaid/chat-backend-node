import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();
const controller = new NotificationController();

router.use(authenticateJWT);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get all user notifications
 *     security: [{ bearerAuth: [] }]
 *     tags: [Notifications]
 *     responses:
 *       200: { description: Success }
 */
router.get('/', (req, res) => controller.getNotifications(req, res));

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     security: [{ bearerAuth: [] }]
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/:id/read', (req, res) => controller.markAsRead(req, res));

export default router;