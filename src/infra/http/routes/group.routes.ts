import { Router } from 'express';
import { GroupController } from '../controllers/GroupController.js';
import { NotificationController } from '../controllers/NotificationController.js';
import { photoUpload } from '../middlewares/photoUpload.js';

const router = Router();
const groupController = new GroupController();
const notificationController = new NotificationController();

// Groups
router.get('/athletes/:athleteId/groups', (req, res) => groupController.listByAthlete(req, res));
router.post('/groups', (req, res) => groupController.create(req, res));
router.get('/groups/:groupId', (req, res) => groupController.getById(req, res));
router.get('/groups/:groupId/home', (req, res) => groupController.getHome(req, res));
router.patch('/groups/:groupId', (req, res) => groupController.update(req, res));
router.patch('/groups/:groupId/photo', photoUpload.single('photo'), (req, res) => groupController.uploadPhoto(req, res));
router.post('/groups/:groupId/admin/delegate', (req, res) => groupController.delegateAdmin(req, res));
router.delete('/groups/:groupId/admin/delegate', (req, res) => groupController.revokeAdmin(req, res));
router.get('/groups/:groupId/balance', (req, res) => groupController.balance(req, res));
router.patch('/groups/:groupId/members/:athleteId/blocked', (req, res) => groupController.setMemberBlocked(req, res));
router.patch('/groups/:groupId/members/:athleteId/injured', (req, res) => groupController.setMemberInjured(req, res));
router.delete('/groups/:groupId/members/:athleteId', (req, res) => groupController.removeMember(req, res));

// Athlete search (for invite flow)
router.get('/groups/athletes/search', (req, res) => groupController.searchAthletes(req, res));

// Invites
router.get('/groups/:groupId/invites', (req, res) => groupController.listGroupInvites(req, res));
router.post('/groups/:groupId/invites', (req, res) => groupController.inviteAthlete(req, res));
router.patch('/invites/:inviteId/respond', (req, res) => groupController.respondInvite(req, res));
router.get('/athletes/:athleteId/invites', (req, res) => groupController.listInvites(req, res));

// Notifications (in-app messages)
router.get('/athletes/:athleteId/notifications', (req, res) => notificationController.list(req, res));
router.patch('/notifications/:notificationId/read', (req, res) => notificationController.markAsRead(req, res));

export { router as groupRouter };
