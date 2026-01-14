import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { ImportExportController } from '../controllers/import-export.controller';

const router = Router();

router.use(authMiddleware);

// Export endpoints
router.get(
  '/tools/excel',
  requirePermission(Permission.TOOL_EXPORT),
  asyncHandler(ImportExportController.exportToolsExcel)
);

router.get(
  '/risks/excel',
  requirePermission(Permission.RISK_READ),
  asyncHandler(ImportExportController.exportRisksExcel)
);

// Import endpoints
router.post(
  '/tools',
  requirePermission(Permission.TOOL_WRITE),
  asyncHandler(ImportExportController.importTools)
);

router.post(
  '/risks',
  requirePermission(Permission.RISK_WRITE),
  asyncHandler(ImportExportController.importRisks)
);

export default router;
