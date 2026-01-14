import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { ActivityController } from '../controllers/activity.controller';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(Permission.AUDITLOG_READ),
  asyncHandler(ActivityController.getFeed)
);

router.get(
  '/:type/:id',
  requirePermission(Permission.AUDITLOG_READ),
  asyncHandler(ActivityController.getItemActivity)
);

export default router;
