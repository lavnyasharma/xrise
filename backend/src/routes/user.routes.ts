import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// Only admins can get the list of agents
router.get('/agents', authMiddleware, requireRole('admin'), userController.getAgents);

export default router;
