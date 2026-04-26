import { Router } from 'express';
import { AssessmentController } from '../controllers/AssessmentController.js';

const router = Router();
const assessmentController = new AssessmentController();

router.post('/athletes/:athleteId/assessment', (req, res) => assessmentController.submit(req, res));

export { router as assessmentRouter };
