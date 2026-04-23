import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { IntegrationConnectorService } from '../services/integration-connector.service';

export class IntegrationsConnectorsController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const rows = await IntegrationConnectorService.list(companyId);
    res.json({ success: true, data: rows });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const row = await IntegrationConnectorService.create(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: row });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const row = await IntegrationConnectorService.update(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: row });
  }
}
