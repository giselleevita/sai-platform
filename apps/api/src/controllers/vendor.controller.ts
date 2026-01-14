import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { VendorService } from '../services/vendor.service';

export class VendorController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const vendors = await VendorService.list(companyId);
    res.json({ success: true, data: vendors });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const vendor = await VendorService.create(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: vendor });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const vendor = await VendorService.update(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: vendor });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await VendorService.delete(companyId, actorId, req.params.id);
    res.json({ success: true });
  }
}
