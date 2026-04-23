import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { EvidenceService } from '../services/evidence.service';

export class EvidenceController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const evidence = await EvidenceService.list(companyId, { limit: Number.isFinite(limit) ? limit : undefined });
    res.json({ success: true, data: evidence });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const evidence = await EvidenceService.create(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: evidence });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const evidence = await EvidenceService.update(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: evidence });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await EvidenceService.delete(companyId, actorId, req.params.id);
    res.json({ success: true });
  }
}
