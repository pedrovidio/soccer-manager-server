import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();
const authController = new AuthController();

router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/social', (req, res) => authController.socialLogin(req, res));

export { router as authRouter };
