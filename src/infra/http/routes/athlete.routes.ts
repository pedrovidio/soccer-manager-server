import { Router } from 'express';
import { AthleteController } from '../controllers/AthleteController.js';
import { photoUpload } from '../middlewares/photoUpload.js';

const router = Router();
const athleteController = new AthleteController();

router.post('/athletes', (req, res) => athleteController.create(req, res));
router.patch('/athletes/:athleteId/location', (req, res) => athleteController.updateLocation(req, res));
router.patch('/athletes/:athleteId/photo', photoUpload.single('photo'), (req, res) => athleteController.uploadPhoto(req, res));

export { router as athleteRouter };
