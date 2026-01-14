import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditLogService } from '../services/audit-log.service';

export class AuditController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const logs = await AuditLogService.list(companyId);
    res.json({ success: true, data: logs });
  }
}
