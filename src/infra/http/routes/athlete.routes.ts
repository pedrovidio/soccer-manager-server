import { Router } from 'express';
import { AthleteController } from '../controllers/AthleteController.js';

const router = Router();
const athleteController = new AthleteController();

router.post('/athletes', (req, res) => athleteController.create(req, res));

export { router as athleteRouter };