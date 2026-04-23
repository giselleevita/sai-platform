import { AuditLogService } from './audit-log.service';
import { prisma } from './prisma.client';
import type { Prisma } from '@prisma/client';

export interface CreateVendorInput {
  name: string;
  region?: string;
  subprocessors?: Record<string, unknown>;
  securityReviewStatus?: string;
}

export class VendorService {
  static async list(companyId: string) {
    return prisma.vendor.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateVendorInput) {
    const vendor = await prisma.vendor.create({
      data: {
        companyId,
        name: input.name,
        region: input.region,
        subprocessors: (input.subprocessors ?? {}) as Prisma.InputJsonValue,
        securityReviewStatus: input.securityReviewStatus,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'vendor.create',
      targetType: 'Vendor',
      targetId: vendor.id,
      changes: input as unknown as Record<string, unknown>,
    });

    return vendor;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateVendorInput>) {
    const vendor = await prisma.vendor.update({
      where: { id, companyId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.region !== undefined ? { region: input.region } : {}),
        ...(input.subprocessors !== undefined ? { subprocessors: (input.subprocessors ?? {}) as Prisma.InputJsonValue } : {}),
        ...(input.securityReviewStatus !== undefined ? { securityReviewStatus: input.securityReviewStatus } : {}),
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'vendor.update',
      targetType: 'Vendor',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    return vendor;
  }

  static async delete(companyId: string, actorId: string | undefined, id: string) {
    await prisma.vendor.delete({
      where: { id, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'vendor.delete',
      targetType: 'Vendor',
      targetId: id,
    });
  }
}
