import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { EvidentiaGovernanceService, isEvidentiaGovernanceConfigured } from '../services/evidentia-governance.service';
import { syncEvidenceToEvidentia } from '../services/evidentia-push.service';
import { BadRequestError, ForbiddenError } from '../errors/AppError';

export class IntegrationsEvidentiaController {
  static async getSettings(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, evidentiaSyncEnabled: true },
    });
    res.json({ success: true, data: company });
  }

  static async getLink(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const link = await prisma.companyEvidentiaLink.findUnique({
      where: { companyId },
      select: { companyId: true, evidentiaTenantId: true, authMode: true, secretRef: true, updatedAt: true },
    });
    res.json({ success: true, data: link });
  }

  static async upsertLink(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can configure Evidentia tenant credentials.');
    }

    const { evidentiaTenantId, secretRef } = req.body as { evidentiaTenantId?: string; secretRef?: string };
    if (!evidentiaTenantId || !secretRef) {
      throw new BadRequestError('evidentiaTenantId and secretRef are required');
    }

    const row = await prisma.companyEvidentiaLink.upsert({
      where: { companyId },
      create: { companyId, evidentiaTenantId, secretRef, authMode: 'STATIC_JWT_ENVREF' },
      update: { evidentiaTenantId, secretRef, authMode: 'STATIC_JWT_ENVREF' },
      select: { companyId: true, evidentiaTenantId: true, authMode: true, secretRef: true, updatedAt: true },
    });
    res.json({ success: true, data: row });
  }

  static async status(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const configured = companyId ? await isEvidentiaGovernanceConfigured(companyId) : await isEvidentiaGovernanceConfigured();
    const ping = companyId
      ? await EvidentiaGovernanceService.pingForCompany(companyId)
      : configured
        ? await EvidentiaGovernanceService.ping()
        : { ok: false, latencyMs: 0, error: 'not_configured' };
    res.json({
      success: true,
      data: {
        configured,
        reachable: ping.ok,
        latencyMs: ping.latencyMs,
        error: ping.error,
      },
    });
  }

  static async listExternal(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (!(await isEvidentiaGovernanceConfigured(companyId))) {
      throw new BadRequestError('Evidentia is not configured on this SAI deployment.');
    }
    const items = await EvidentiaGovernanceService.listEvidence(
      { companyId }
    );
    res.json({ success: true, data: items });
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can change Evidentia sync settings.');
    }
    const { evidentiaSyncEnabled } = req.body as { evidentiaSyncEnabled?: boolean };
    if (typeof evidentiaSyncEnabled !== 'boolean') {
      throw new BadRequestError('evidentiaSyncEnabled (boolean) is required');
    }
    if (evidentiaSyncEnabled && !(await isEvidentiaGovernanceConfigured(companyId))) {
      throw new BadRequestError(
        'Cannot enable Evidentia sync until Evidentia is configured for this company.'
      );
    }
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { evidentiaSyncEnabled },
      select: { id: true, evidentiaSyncEnabled: true },
    });
    res.json({ success: true, data: company });
  }

  static async push(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId || !actorId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (!(await isEvidentiaGovernanceConfigured(companyId))) {
      throw new BadRequestError('Evidentia is not configured.');
    }
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { evidentiaSyncEnabled: true },
    });
    if (!company?.evidentiaSyncEnabled) {
      throw new BadRequestError('Evidentia sync is disabled for this company. Enable it in settings first.');
    }

    const evidenceId = typeof req.body?.evidenceId === 'string' ? req.body.evidenceId : undefined;
    if (evidenceId) {
      await syncEvidenceToEvidentia(companyId, evidenceId, actorId);
      res.json({ success: true, data: { pushed: 1, evidenceId } });
      return;
    }

    const rows = await prisma.evidence.findMany({
      where: { companyId },
      select: { id: true },
    });
    for (const r of rows) {
      await syncEvidenceToEvidentia(companyId, r.id, actorId);
    }
    res.json({ success: true, data: { pushed: rows.length } });
  }
}
