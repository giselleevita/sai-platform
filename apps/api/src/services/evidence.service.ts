import { AuditLogService } from './audit-log.service';
import { prisma } from './prisma.client';
import { normalizeEvidenceStatus } from './status-normalization.service';
import { syncEvidenceToEvidentia } from './evidentia-push.service';
import { NotFoundError } from '../errors/AppError';
import { computeEvidenceGovernanceHash } from '../domain/evidence-governance-hash';
import type { Prisma } from '@prisma/client';

export interface CreateEvidenceInput {
  controlId: string;
  source: string;
  status?: string;
  validFrom?: string;
  validTo?: string;
  reference?: string;
  collectionMethod?: string;
}

export interface UpdateEvidenceInput extends Partial<CreateEvidenceInput> {
  assignedReviewerId?: string | null;
  reviewNote?: string | null;
}

export class EvidenceService {
  static async list(companyId: string, opts?: { limit?: number }) {
    const limit = Math.max(1, Math.min(opts?.limit ?? 200, 1000));
    return prisma.evidence.findMany({
      where: { companyId },
      include: { control: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateEvidenceInput) {
    const status = normalizeEvidenceStatus(input.status) ?? 'SUBMITTED';
    const hash = computeEvidenceGovernanceHash({
      controlId: input.controlId,
      source: input.source,
      reference: input.reference,
      status,
    });

    const evidence = await prisma.evidence.create({
      data: {
        companyId,
        controlId: input.controlId,
        source: input.source,
        status,
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validTo: input.validTo ? new Date(input.validTo) : undefined,
        reference: input.reference,
        collectionMethod: input.collectionMethod ?? 'manual',
        contentHash: hash,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'evidence.create',
      targetType: 'Evidence',
      targetId: evidence.id,
      changes: input as unknown as Record<string, unknown>,
    });

    if (actorId) {
      void syncEvidenceToEvidentia(companyId, evidence.id, actorId);
    }

    return evidence;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: UpdateEvidenceInput) {
    const existing = await prisma.evidence.findFirst({ where: { id, companyId } });
    if (!existing) {
      throw new NotFoundError('Evidence not found');
    }

    const resolvedStatus =
      input.status !== undefined ? normalizeEvidenceStatus(input.status) : existing.status;
    const controlId = input.controlId ?? existing.controlId;
    const source = input.source ?? existing.source;
    const reference = input.reference !== undefined ? input.reference : existing.reference;

    const data: Prisma.EvidenceUncheckedUpdateInput = {};
    if (input.controlId !== undefined) data.controlId = input.controlId;
    if (input.source !== undefined) data.source = input.source;
    if (input.reference !== undefined) data.reference = input.reference;
    if (input.validFrom !== undefined) data.validFrom = input.validFrom ? new Date(input.validFrom) : null;
    if (input.validTo !== undefined) data.validTo = input.validTo ? new Date(input.validTo) : null;
    if (input.assignedReviewerId !== undefined) data.assignedReviewerId = input.assignedReviewerId;
    if (input.reviewNote !== undefined) data.reviewNote = input.reviewNote;
    if (input.status !== undefined) {
      data.status = resolvedStatus;
      if (resolvedStatus === 'APPROVED' && actorId) {
        data.reviewedAt = new Date();
        data.reviewedById = actorId;
      }
    }

    data.contentHash = computeEvidenceGovernanceHash({
      controlId,
      source,
      reference,
      status: String(resolvedStatus),
    });

    const evidence = await prisma.evidence.update({
      where: { id, companyId },
      data,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'evidence.update',
      targetType: 'Evidence',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    if (actorId) {
      void syncEvidenceToEvidentia(companyId, id, actorId);
    }

    return evidence;
  }

  static async delete(companyId: string, actorId: string | undefined, id: string) {
    await prisma.evidence.delete({
      where: { id, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'evidence.delete',
      targetType: 'Evidence',
      targetId: id,
    });
  }
}
