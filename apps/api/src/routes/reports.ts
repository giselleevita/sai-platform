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
 * Requires: REPORT_READ
 */
router.post(
  '/scheduled',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.createScheduledReport)
);

/**
 * DELETE /api/reports/scheduled/:id
 * Delete scheduled report
 * Requires: REPORT_READ
 */
router.delete(
  '/scheduled/:id',
  requirePermission(Permission.REPORT_READ),
  asyncHandler(ReportController.deleteScheduledReport)
);

export default router;
