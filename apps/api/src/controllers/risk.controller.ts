import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { RiskService } from '../services/risk.service';

export class RiskController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const pagination = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await RiskService.list(companyId, {
      pagination,
      search: req.query.q as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      category: req.query.category as string | undefined,
    });

    res.json({ success: true, ...result });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const risk = await RiskService.create(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: risk });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const risk = await RiskService.update(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: risk });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await RiskService.delete(companyId, actorId, req.params.id);
    res.json({ success: true });
  }

  static async addDecision(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const decision = await RiskService.addDecision(companyId, actorId, req.params.id, req.body);
    res.status(201).json({ success: true, data: decision });
  }
}
