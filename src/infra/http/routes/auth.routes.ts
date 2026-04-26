import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();
const authController = new AuthController();

router.post('/auth/login', (req, res) => authController.login(req, res));

export { router as authRouter };
