import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// Both endpoints require authenticated agent or admin
router.post(
  '/:ticketId/draft-reply',
  authMiddleware,
  requireRole('agent', 'admin'),
  aiController.draftReply
);

router.post(
  '/:ticketId/summarise',
  authMiddleware,
  requireRole('agent', 'admin'),
  aiController.summarise
);

export default router;
