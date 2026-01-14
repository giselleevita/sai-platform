import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { BulkController } from '../controllers/bulk.controller';
import { validate } from '../middleware/validation';
import { bulkDeleteSchema, bulkUpdateSchema } from '../validation/schemas';

const router = Router();

router.use(authMiddleware);

// Inventory bulk operations
router.post(
  '/inventory/delete',
  requirePermission(Permission.TOOL_DELETE),
  validate({ body: bulkDeleteSchema }),
  asyncHandler(BulkController.bulkDeleteTools)
);

router.post(
  '/inventory/update',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: bulkUpdateSchema }),
  asyncHandler(BulkController.bulkUpdateTools)
);

// Risk bulk operations
router.post(
  '/risks/delete',
  requirePermission(Permission.RISK_DELETE),
  validate({ body: bulkDeleteSchema }),
  asyncHandler(BulkController.bulkDeleteRisks)
);

router.post(
  '/risks/update',
  requirePermission(Permission.RISK_WRITE),
  validate({ body: bulkUpdateSchema }),
  asyncHandler(BulkController.bulkUpdateRisks)
);

export default router;
