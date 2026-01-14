import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { InventoryController } from '../controllers';
import { validateCreateTool, validateUpdateTool } from '../validation';
import { validate } from '../middleware/validation';
import { createToolSchema, updateToolSchema, paginationSchema, searchSchema } from '../validation/schemas';
import { asyncHandler } from '../utils';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/inventory
 * Get all AI tools for company with pagination and search
 * Requires: TOOL_READ
 */
router.get(
  '/',
  requirePermission(Permission.TOOL_READ),
  validate({ query: paginationSchema.merge(searchSchema) }),
  asyncHandler(InventoryController.getTools)
);

/**
 * GET /api/inventory/summary
 * Get risk summary for company
 * Requires: TOOL_READ
 */
router.get('/summary', requirePermission(Permission.TOOL_READ), asyncHandler(InventoryController.getSummary));

/**
 * GET /api/inventory/export/csv
 * Export tools as CSV
 * Requires: TOOL_EXPORT
 */
router.get('/export/csv', requirePermission(Permission.TOOL_EXPORT), asyncHandler(InventoryController.exportCSV));

/**
 * GET /api/inventory/:id
 * Get specific tool
 * Requires: TOOL_READ
 */
router.get('/:id', requirePermission(Permission.TOOL_READ), asyncHandler(InventoryController.getTool));

/**
 * GET /api/inventory/:id/governance
 * Get governance profile for tool
 * Requires: TOOL_READ
 */
router.get('/:id/governance', requirePermission(Permission.TOOL_READ), asyncHandler(InventoryController.getToolGovernance));

/**
 * GET /api/inventory/:id/decisions
 * Get decision history for tool
 * Requires: TOOL_READ
 */
router.get('/:id/decisions', requirePermission(Permission.TOOL_READ), asyncHandler(InventoryController.getToolDecisionLogs));

/**
 * POST /api/inventory/:id/decisions
 * Add decision log entry
 * Requires: TOOL_WRITE (management/security)
 */
router.post('/:id/decisions', requirePermission(Permission.TOOL_WRITE), asyncHandler(InventoryController.addToolDecisionLog));

/**
 * POST /api/inventory
 * Create new AI tool
 * Validates input before processing
 * Requires: TOOL_WRITE
 */
router.post(
  '/',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: createToolSchema }),
  asyncHandler(InventoryController.createTool)
);

/**
 * PATCH /api/inventory/:id
 * Update AI tool
 * Validates input before processing
 * Requires: TOOL_WRITE
 */
router.patch(
  '/:id',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: updateToolSchema }),
  asyncHandler(InventoryController.updateTool)
);

/**
 * DELETE /api/inventory/:id
 * Delete AI tool
 * Requires: TOOL_DELETE
 */
router.delete('/:id', requirePermission(Permission.TOOL_DELETE), asyncHandler(InventoryController.deleteTool));

export default router;
