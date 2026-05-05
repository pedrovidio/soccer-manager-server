import { Router } from 'express';
import { MatchController } from '../controllers/MatchController.js';

const router = Router();
const c = new MatchController();

router.post('/matches',                              (req, res) => c.create(req, res));
router.get('/matches/:matchId',                      (req, res) => c.getDetail(req, res));
router.get('/matches/:matchId/nearby-athletes',      (req, res) => c.nearbyAthletes(req, res));
router.patch('/matches/:matchId',                    (req, res) => c.update(req, res));
router.get('/groups/:groupId/matches',               (req, res) => c.listByGroup(req, res));
router.patch('/match-invites/:inviteId/respond',     (req, res) => c.respondInvite(req, res));
router.post('/matches/:matchId/open-vacancies',      (req, res) => c.openVacancies(req, res));
router.post('/matches/:matchId/confirm-presence',    (req, res) => c.confirmPresence(req, res));
router.post('/matches/:matchId/check-in',            (req, res) => c.checkIn(req, res));
router.post('/matches/:matchId/ratings',             (req, res) => c.registerRating(req, res));
router.post('/matches/:matchId/matchmaking',         (req, res) => c.matchmaking(req, res));
router.patch('/matches/:matchId/cancel',             (req, res) => c.cancelMatch(req, res));

export { router as matchRouter };
