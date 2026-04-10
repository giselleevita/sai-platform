import { prisma } from './prisma.client';

export interface AuditLogInput {
  companyId: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  changes?: Record<string, unknown>;
}

export class AuditLogService {
  static async log(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        changes: input.changes as any,
      },
    });
  }

  static async list(companyId: string) {
    return prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  static async listByAction(
    companyId: string,
    action: string,
    targetType?: string,
    take = 50
  ) {
    return prisma.auditLog.findMany({
      where: {
        companyId,
        action,
        ...(targetType ? { targetType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  static async listByTarget(
    companyId: string,
    targetType: string,
    targetId: string,
    take = 100
  ) {
    return prisma.auditLog.findMany({
      where: {
        companyId,
        targetType,
        targetId,
      },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  static async listByTargetIds(
    companyId: string,
    targetType: string,
    targetIds: string[]
  ) {
    if (targetIds.length === 0) {
      return [];
    }

    return prisma.auditLog.findMany({
      where: {
        companyId,
        targetType,
        targetId: { in: targetIds },
      },
      orderBy: [{ targetId: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
