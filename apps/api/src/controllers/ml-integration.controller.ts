import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MLIntegrationService } from '../services/ml-integration.service';
import { BadRequestError } from '../errors/AppError';

export class MLIntegrationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }

    const rows = await MLIntegrationService.listByCompany(companyId);
    res.json({ success: true, data: rows });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }

    const row = await MLIntegrationService.create(companyId, req.body);
    res.status(201).json({ success: true, data: row });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }

    const row = await MLIntegrationService.update(companyId, req.params.id, req.body);
    res.json({ success: true, data: row });
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }

    await MLIntegrationService.delete(companyId, req.params.id);
    res.json({ success: true });
  }
}
