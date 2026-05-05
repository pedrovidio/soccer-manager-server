import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';

const router = Router();
const c = new NotificationController();

router.get('/athletes/:athleteId/notifications',                              (req, res) => c.list(req, res));
router.patch('/athletes/:athleteId/notifications/:notificationId/read',       (req, res) => c.markAsRead(req, res));
router.patch('/athletes/:athleteId/notifications/read-all',                   (req, res) => c.markAllAsRead(req, res));
router.delete('/athletes/:athleteId/notifications/:notificationId',           (req, res) => c.deleteOne(req, res));
router.delete('/athletes/:athleteId/notifications',                           (req, res) => c.deleteAll(req, res));

export { router as notificationRouter };
