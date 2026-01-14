import { PrismaClient } from '@prisma/client';
import { AuditLogService } from './audit-log.service';

const prisma = new PrismaClient();

export interface CreateExceptionInput {
  toolId?: string;
  riskId?: string;
  requestedBy?: string;
  status?: string;
  expiresAt?: string;
}

export class ExceptionService {
  static async list(companyId: string) {
    return (prisma as any).exception.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateExceptionInput) {
    const exception = await (prisma as any).exception.create({
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
      changes: input as any,
    });

    return exception;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: CreateExceptionInput) {
    const exception = await (prisma as any).exception.update({
      where: { id, companyId },
      data: {
        toolId: input.toolId,
        riskId: input.riskId,
        status: input.status,
        approvedBy: input.status && input.status !== 'Pending' ? actorId : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'exception.update',
      targetType: 'Exception',
      targetId: id,
      changes: input as any,
    });

    return exception;
  }
}
