import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { WebhooksController } from '../controllers/webhooks.controller';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters'),
});

router.get(
  '/',
  requirePermission(Permission.TOOL_READ), // Any read permission
  asyncHandler(WebhooksController.list)
);

router.post(
  '/',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: createWebhookSchema }),
  asyncHandler(WebhooksController.create)
);

router.delete(
  '/:id',
  requirePermission(Permission.TOOL_WRITE),
  asyncHandler(WebhooksController.delete)
);

export default router;
