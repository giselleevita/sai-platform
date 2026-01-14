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
}
