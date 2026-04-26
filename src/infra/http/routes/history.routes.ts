import { Router } from 'express';
import { HistoryController } from '../controllers/HistoryController.js';

const router = Router();
const c = new HistoryController();

router.post('/matches/:matchId/score',              (req, res) => c.registerScore(req, res));
router.get('/groups/:groupId/history',              (req, res) => c.groupHistory(req, res));
router.get('/athletes/:athleteId/history',          (req, res) => c.athleteHistory(req, res));
router.get('/athletes/:athleteId/dashboard',        (req, res) => c.athleteDashboard(req, res));

export { router as historyRouter };
