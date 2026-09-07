import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { AuditController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get(
  '/facets',
  requirePermission(Permission.AUDITLOG_READ),
  asyncHandler(AuditController.facets)
);
router.get('/', requirePermission(Permission.AUDITLOG_READ), asyncHandler(AuditController.list));

export default router;
