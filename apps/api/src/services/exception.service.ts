import { AuditLogService } from './audit-log.service';
import { prisma } from './prisma.client';

export interface CreateExceptionInput {
  toolId?: string;
  riskId?: string;
  requestedBy?: string;
  status?: string;
  expiresAt?: string;
}

export class ExceptionService {
  static async list(companyId: string) {
    return prisma.exception.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateExceptionInput) {
    const exception = await prisma.exception.create({
      data: {
        companyId,
        toolId: input.toolId,
        riskId: input.riskId,
        requestedBy: input.requestedBy || actorId,
        approvedBy: undefined,
        status: input.status || 'Pending',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'exception.create',
      targetType: 'Exception',
      targetId: exception.id,
      changes: input as unknown as Record<string, unknown>,
    });

    return exception;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: CreateExceptionInput) {
    const exception = await prisma.exception.update({
      where: { id, companyId },
      data: {
        ...(input.toolId !== undefined ? { toolId: input.toolId } : {}),
        ...(input.riskId !== undefined ? { riskId: input.riskId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.status !== undefined && input.status !== 'Pending' ? { approvedBy: actorId } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } : {}),
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'exception.update',
      targetType: 'Exception',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    return exception;
  }
}
