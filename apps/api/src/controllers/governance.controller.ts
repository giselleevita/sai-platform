import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { GovernanceService } from '../services/governance.service';

export class GovernanceController {
  static async listPolicies(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const policies = await GovernanceService.listPolicies(companyId);
    res.json({ success: true, data: policies });
  }

  static async createPolicy(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const policy = await GovernanceService.createPolicy(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: policy });
  }

  static async updatePolicy(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const policy = await GovernanceService.updatePolicy(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: policy });
  }

  static async deletePolicy(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await GovernanceService.deletePolicy(companyId, actorId, req.params.id);
    res.json({ success: true });
  }

  static async listControls(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const controls = await GovernanceService.listControls(companyId);
    res.json({ success: true, data: controls });
  }

  static async createControl(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const control = await GovernanceService.createControl(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: control });
  }

  static async updateControl(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const control = await GovernanceService.updateControl(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: control });
  }

  static async deleteControl(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await GovernanceService.deleteControl(companyId, actorId, req.params.id);
    res.json({ success: true });
  }

  static async listProcedures(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const procedures = await GovernanceService.listProcedures(companyId);
    res.json({ success: true, data: procedures });
  }

  static async createProcedure(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const procedure = await GovernanceService.createProcedure(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: procedure });
  }

  static async updateProcedure(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const procedure = await GovernanceService.updateProcedure(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: procedure });
  }

  static async deleteProcedure(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await GovernanceService.deleteProcedure(companyId, actorId, req.params.id);
    res.json({ success: true });
  }

  static async listRegulations(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const regulations = await GovernanceService.listRegulations(companyId);
    res.json({ success: true, data: regulations });
  }

  static async createRegulation(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const regulation = await GovernanceService.createRegulation(companyId, actorId, req.body);
    res.status(201).json({ success: true, data: regulation });
  }

  static async updateRegulation(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const regulation = await GovernanceService.updateRegulation(companyId, actorId, req.params.id, req.body);
    res.json({ success: true, data: regulation });
  }

  static async deleteRegulation(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await GovernanceService.deleteRegulation(companyId, actorId, req.params.id);
    res.json({ success: true });
  }
}
