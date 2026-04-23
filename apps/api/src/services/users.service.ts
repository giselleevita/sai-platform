import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';
import type { Prisma } from '@prisma/client';

export type UpdateUserInput = {
  role?: 'MANAGEMENT' | 'ADMIN' | 'OPERATOR' | 'AUDITOR';
  disabled?: boolean;
};

export class UsersService {
  static async listUsers(companyId: string) {
    return prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        disabledAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async updateUser(
    companyId: string,
    actorId: string | undefined,
    userId: string,
    input: UpdateUserInput,
  ) {
    const data: Prisma.UserUpdateManyMutationInput = {};
    if (input.role !== undefined) data.role = input.role;
    if (input.disabled !== undefined) data.disabledAt = input.disabled ? new Date() : null;

    const updated = await prisma.user.updateMany({
      where: { id: userId, companyId },
      data,
    });
    if (!updated.count) {
      throw new Error('User not found');
    }

    if (input.role !== undefined) {
      await AuditLogService.log({
        companyId,
        actorId,
        action: 'user.role.update',
        targetType: 'User',
        targetId: userId,
        changes: { role: input.role },
      });
    }
    if (input.disabled === true) {
      await AuditLogService.log({
        companyId,
        actorId,
        action: 'user.disable',
        targetType: 'User',
        targetId: userId,
      });
    }
    if (input.disabled === false) {
      await AuditLogService.log({
        companyId,
        actorId,
        action: 'user.enable',
        targetType: 'User',
        targetId: userId,
      });
    }

    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        disabledAt: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

