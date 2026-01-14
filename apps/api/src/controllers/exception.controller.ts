import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ExceptionService } from '../services/exception.service';

export class ExceptionController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const exceptions = await ExceptionService.list(companyId);
    res.json({ success: true, data: exceptions });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const exception = await ExceptionService.create(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: exception });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const exception = await ExceptionService.update(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: exception });
  }
}
