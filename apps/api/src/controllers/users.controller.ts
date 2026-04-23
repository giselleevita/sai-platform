import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UsersService } from '../services/users.service';

export class UsersController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const users = await UsersService.listUsers(companyId);
    res.json({ success: true, data: users });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const updated = await UsersService.updateUser(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: updated });
  }
}

