import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { IncidentService } from '../services/incident.service';

export class IncidentController {
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

    const result = await IncidentService.list(companyId, {
      pagination,
      search: req.query.q as string | undefined,
      status: req.query.status as string | undefined,
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
    const incident = await IncidentService.create(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: incident });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const incident = await IncidentService.update(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: incident });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await IncidentService.delete(companyId, actorId, req.params.id);
    res.json({ success: true });
  }
}
