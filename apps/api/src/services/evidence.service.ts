import { AuditLogService } from './audit-log.service';
import { prisma } from './prisma.client';
import { normalizeEvidenceStatus } from './status-normalization.service';

export interface CreateEvidenceInput {
  controlId: string;
  source: string;
  status?: string;
  validFrom?: string;
  validTo?: string;
  reference?: string;
}

export class EvidenceService {
  static async list(companyId: string) {
    // Type assertion to bypass Prisma client generation issue
    return (prisma as any).evidence.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateEvidenceInput) {
    // Type assertion to bypass Prisma client generation issue
    const evidence = await (prisma as any).evidence.create({
      data: {
        companyId,
        controlId: input.controlId,
        source: input.source,
        status: normalizeEvidenceStatus(input.status),
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validTo: input.validTo ? new Date(input.validTo) : undefined,
        reference: input.reference,
      } as any,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'evidence.create',
      targetType: 'Evidence',
      targetId: evidence.id,
      changes: input as any,
    });

    return evidence;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateEvidenceInput>) {
    // Type assertion to bypass Prisma client generation issue
    const evidence = await (prisma as any).evidence.update({
      where: { id, companyId },
      data: {
        controlId: input.controlId,
        source: input.source,
        status: normalizeEvidenceStatus(input.status),
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validTo: input.validTo ? new Date(input.validTo) : undefined,
        reference: input.reference,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'evidence.update',
      targetType: 'Evidence',
      targetId: id,
      changes: input as any,
    });

    return evidence;
  }

  static async delete(companyId: string, actorId: string | undefined, id: string) {
    // Type assertion to bypass Prisma client generation issue
    await (prisma as any).evidence.delete({
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
