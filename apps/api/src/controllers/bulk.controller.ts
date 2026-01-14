import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { BulkOperationsService } from '../services/bulk-operations.service';
import { BadRequestError } from '../errors/AppError';

export class BulkController {
  /**
   * POST /api/inventory/bulk/delete
   * Bulk delete tools
   */
  static async bulkDeleteTools(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('IDs array is required and must not be empty');
    }

    if (ids.length > 100) {
      throw new BadRequestError('Cannot delete more than 100 items at once');
    }

    const result = await BulkOperationsService.bulkDeleteTools(companyId, actorId, ids);
    res.json({ success: true, data: result });
  }

  /**
   * POST /api/inventory/bulk/update
   * Bulk update tools
   */
  static async bulkUpdateTools(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('IDs array is required and must not be empty');
    }

    if (ids.length > 100) {
      throw new BadRequestError('Cannot update more than 100 items at once');
    }

    if (!updates || typeof updates !== 'object') {
      throw new BadRequestError('Updates object is required');
    }

    const result = await BulkOperationsService.bulkUpdateTools(companyId, actorId, ids, updates);
    res.json({ success: true, data: result });
  }

  /**
   * POST /api/risks/bulk/delete
   * Bulk delete risks
   */
  static async bulkDeleteRisks(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('IDs array is required and must not be empty');
    }

    if (ids.length > 100) {
      throw new BadRequestError('Cannot delete more than 100 items at once');
    }

    const result = await BulkOperationsService.bulkDeleteRisks(companyId, actorId, ids);
    res.json({ success: true, data: result });
  }

  /**
   * POST /api/risks/bulk/update
   * Bulk update risks
   */
  static async bulkUpdateRisks(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('IDs array is required and must not be empty');
    }

    if (ids.length > 100) {
      throw new BadRequestError('Cannot update more than 100 items at once');
    }

    if (!updates || typeof updates !== 'object') {
      throw new BadRequestError('Updates object is required');
    }

    const result = await BulkOperationsService.bulkUpdateRisks(companyId, actorId, ids, updates);
    res.json({ success: true, data: result });
  }
}
