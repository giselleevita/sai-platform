import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { EntitlementsController } from '../controllers/entitlements.controller';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(Permission.USER_READ),
  asyncHandler(EntitlementsController.getPlanAndUsage)
);

export default router;

