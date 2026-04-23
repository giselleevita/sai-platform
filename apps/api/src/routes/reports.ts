import { Router } from 'express';
import { authMiddleware, requirePermission, Permission, reportRateLimiter } from '../middleware';
import { asyncHandler } from '../utils';
import { ReportController } from '../controllers/report.controller';

const router = Router();

router.use(authMiddleware);
router.use(reportRateLimiter); // Apply rate limiting to all report endpoints

/**
 * GET /api/reports/risk-assessment
 * Generate risk assessment report
 * Requires: REPORT_READ
 */
router.get(
  '/risk-assessment',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.generateRiskAssessment)
);

/**
 * GET /api/reports/compliance
 * Generate compliance report
 * Requires: REPORT_READ
 */
router.get(
  '/compliance',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.generateCompliance)
);
router.get(
  '/compliance-export',
  requirePermission(Permission.REPORT_EXPORT),
  asyncHandler(ReportController.exportCompliance)
);

/**
 * GET /api/reports/executive-summary
 * Generate executive summary report
 * Requires: REPORT_READ
 */
router.get(
  '/executive-summary',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.generateExecutiveSummary)
);

/**
 * GET /api/reports/audit-package
 * Auditor-oriented JSON bundle (download / archive externally as needed).
 */
router.get(
  '/audit-package',
  requirePermission(Permission.REPORT_EXPORT),
  asyncHandler(ReportController.generateAuditPackage)
);

/**
 * POST /api/reports/custom
 * Generate custom report
 * Requires: REPORT_READ
 */
router.post(
  '/custom',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.generateCustom)
);

/**
 * GET /api/reports/scheduled
 * Get scheduled reports
 * Requires: REPORT_READ
 */
router.get(
  '/scheduled',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.getScheduledReports)
);

/**
 * POST /api/reports/scheduled
 * Create scheduled report
 * Requires: REPORT_EXPORT (write operation)
 */
router.post(
  '/scheduled',
  requirePermission(Permission.REPORT_EXPORT),
  asyncHandler(ReportController.createScheduledReport)
);

/**
 * PATCH /api/reports/scheduled/:id
 * Update scheduled report
 * Requires: REPORT_READ
 */
router.patch(
  '/scheduled/:id',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.updateScheduledReport)
);

/**
 * DELETE /api/reports/scheduled/:id
 * Delete scheduled report
 * Requires: REPORT_EXPORT (write operation)
 */
router.delete(
  '/scheduled/:id',
  requirePermission(Permission.REPORT_EXPORT),
  asyncHandler(ReportController.deleteScheduledReport)
);

export default router;
