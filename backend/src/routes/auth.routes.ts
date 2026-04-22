import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(authController.loginSchema), authController.login);

export default router;
