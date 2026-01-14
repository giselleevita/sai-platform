import { PrismaClient } from '@prisma/client';
import { AuditLogService } from './audit-log.service';

const prisma = new PrismaClient();

export interface CreateVendorInput {
  name: string;
  region?: string;
  subprocessors?: Record<string, unknown>;
  securityReviewStatus?: string;
}

export class VendorService {
  static async list(companyId: string) {
    return (prisma as any).vendor.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateVendorInput) {
    const vendor = await (prisma as any).vendor.create({
      data: {
        companyId,
        name: input.name,
        region: input.region,
        subprocessors: input.subprocessors,
        securityReviewStatus: input.securityReviewStatus,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'vendor.create',
      targetType: 'Vendor',
      targetId: vendor.id,
      changes: input as any,
    });

    return vendor;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateVendorInput>) {
    const vendor = await (prisma as any).vendor.update({
      where: { id, companyId },
      data: {
        name: input.name,
        region: input.region,
        subprocessors: input.subprocessors,
        securityReviewStatus: input.securityReviewStatus,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'vendor.update',
      targetType: 'Vendor',
      targetId: id,
      changes: input as any,
    });

    return vendor;
  }

  static async delete(companyId: string, actorId: string | undefined, id: string) {
    await (prisma as any).vendor.delete({
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
