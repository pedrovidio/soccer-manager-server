import { Router } from 'express';
import { GroupController } from '../controllers/GroupController.js';
import { NotificationController } from '../controllers/NotificationController.js';

const router = Router();
const groupController = new GroupController();
const notificationController = new NotificationController();

// Groups
router.post('/groups', (req, res) => groupController.create(req, res));

// Athlete search (for invite flow)
router.get('/groups/athletes/search', (req, res) => groupController.searchAthletes(req, res));

// Invites
router.post('/groups/:groupId/invites', (req, res) => groupController.inviteAthlete(req, res));
router.patch('/invites/:inviteId/respond', (req, res) => groupController.respondInvite(req, res));
router.get('/athletes/:athleteId/invites', (req, res) => groupController.listInvites(req, res));

// Notifications (in-app messages)
router.get('/athletes/:athleteId/notifications', (req, res) => notificationController.list(req, res));
router.patch('/notifications/:notificationId/read', (req, res) => notificationController.markAsRead(req, res));

export { router as groupRouter };
