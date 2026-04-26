import { Router } from 'express';
import { AthleteController } from '../controllers/AthleteController.js';

const router = Router();
const athleteController = new AthleteController();

router.post('/athletes', (req, res) => athleteController.create(req, res));
router.patch('/athletes/:athleteId/location', (req, res) => athleteController.updateLocation(req, res));

export { router as athleteRouter };
