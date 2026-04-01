import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ConformityService } from '../services/conformity.service';
import { WebhooksService } from '../services/webhooks.service';

export class ConformityController {
  static async assess(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const result = ConformityService.assess(req.body);

    void WebhooksService.triggerWebhook(companyId, 'compliance.conformity.assessed', {
      systemName: result.systemName,
      status: result.status,
      score: result.score,
      gaps: result.gaps,
    });

    res.json({ success: true, data: result });
  }
}