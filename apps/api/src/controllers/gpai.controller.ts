import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { GpaiService } from '../services/gpai.service';
import { WebhooksService } from '../services/webhooks.service';

export class GpaiController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const rows = await GpaiService.list(companyId);
    res.json({ success: true, data: rows });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const row = await GpaiService.create(companyId, req.body);

    void WebhooksService.triggerWebhook(companyId, 'compliance.gpai.registered', {
      gpaiId: row.id,
      provider: row.provider,
      displayName: row.displayName,
      status: row.status,
    });

    res.status(201).json({ success: true, data: row });
  }
}