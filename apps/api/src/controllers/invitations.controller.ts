import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { InvitationsService } from '../services/invitations.service';

export class InvitationsController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const rows = await InvitationsService.listInvitations(companyId);
    res.json({ success: true, data: rows });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { invitation, token } = await InvitationsService.createInvitation(companyId, actorId, req.body);
    res.status(201).json({
      success: true,
      data: {
        invitation,
        token, // shown once; store client-side and share with invitee
        inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?invite=${token}`,
      },
    });
  }

  static async revoke(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await InvitationsService.revokeInvitation(companyId, actorId, req.params.id);
    res.json({ success: true });
  }
}

