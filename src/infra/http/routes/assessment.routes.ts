import { Router } from 'express';
import { AssessmentController } from '../controllers/AssessmentController.js';

const router = Router();
const assessmentController = new AssessmentController();

router.get('/athletes/:athleteId/assessment', (req, res) => assessmentController.get(req, res));
router.post('/athletes/:athleteId/assessment', (req, res) => assessmentController.submit(req, res));
router.patch('/athletes/:athleteId/assessment', (req, res) => assessmentController.submit(req, res));

export { router as assessmentRouter };
