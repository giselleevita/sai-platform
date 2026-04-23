import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { EntitlementsService } from '../services/entitlements.service';
import { BadRequestError } from '../errors/AppError';

function sha256Json(obj: unknown): string {
  const json = JSON.stringify(obj ?? null);
  return crypto.createHash('sha256').update(json).digest('hex');
}

export class GovernanceExportController {
  static async exportManifest(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const enabled = await EntitlementsService.getBool(companyId, 'report_exports_enabled');
    if (enabled === false) {
      throw new BadRequestError('Report exports are disabled for your plan');
    }
    const maxPerDay = await EntitlementsService.getInt(companyId, 'max_report_exports_per_day');
    if (typeof maxPerDay === 'number') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const exports = await prisma.auditLog.count({
        where: { companyId, action: 'REPORT_EXPORT', createdAt: { gte: since } },
      });
      if (exports >= maxPerDay) {
        throw new BadRequestError(`Plan limit reached: max_report_exports_per_day=${maxPerDay}`);
      }
    }

    const snapshots = await prisma.complianceSnapshot.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, summary: true },
      take: 100,
    });

    const max = 1000;
    const limit = Math.max(1, Math.min(Number(req.query.limit || '500'), max));

    const evidence = await prisma.evidence.findMany({
      where: { companyId },
      select: { id: true, controlId: true, status: true, contentHash: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const attachments = await prisma.evidenceAttachment.findMany({
      where: { companyId },
      select: { id: true, evidenceId: true, filename: true, sha256: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    });

    const byEvidence = new Map<string, any[]>();
    for (const a of attachments) {
      const arr = byEvidence.get(a.evidenceId) ?? [];
      arr.push(a);
      byEvidence.set(a.evidenceId, arr);
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        actorId: req.user?.id || null,
        action: 'REPORT_EXPORT',
        targetType: 'Report',
        targetId: null,
        changes: { type: 'governance-export-manifest', limit } as any,
      },
    });

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        companyId,
        snapshots: snapshots.map((s) => ({ id: s.id, createdAt: s.createdAt, sha256: sha256Json(s.summary) })),
        evidence: evidence.map((e) => ({
          id: e.id,
          controlId: e.controlId,
          status: e.status,
          contentHash: e.contentHash,
          updatedAt: e.updatedAt,
          attachments: (byEvidence.get(e.id) ?? []).map((a) => ({
            id: a.id,
            filename: a.filename,
            sha256: a.sha256,
            sizeBytes: a.sizeBytes,
            createdAt: a.createdAt,
          })),
        })),
      },
    });
  }
}

