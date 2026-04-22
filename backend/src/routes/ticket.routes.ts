import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller';
import { authMiddleware } from '../middleware/auth';
import { publicRateLimiter } from '../middleware/rateLimit';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validate';

const router = Router();

// -----------------------------
// Public (rate limited)
// -----------------------------
router.post(
  '/',
  publicRateLimiter,
  validate(ticketController.createTicketSchema),
  ticketController.create
);

router.post(
  '/status',
  publicRateLimiter,
  validate(ticketController.publicStatusSchema),
  ticketController.publicStatus
);

// -----------------------------
// Protected (agent + admin)
// -----------------------------
router.get(
  '/',
  authMiddleware,
  requireRole('agent', 'admin'),
  validate(ticketController.listTicketsSchema, 'query'),
  ticketController.list
);

router.get(
  '/:id',
  authMiddleware,
  requireRole('agent', 'admin'),
  ticketController.details
);

router.post(
  '/:id/reply',
  authMiddleware,
  requireRole('agent', 'admin'),
  validate(ticketController.replySchema),
  ticketController.reply
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('agent', 'admin'),
  validate(ticketController.statusSchema),
  ticketController.updateStatus
);

router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole('admin'),
  validate(ticketController.assignSchema),
  ticketController.assign
);

export default router;
