import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';
import type { Prisma } from '@prisma/client';

export class BulkOperationsService {
  /**
   * Bulk delete tools
   */
  static async bulkDeleteTools(
    companyId: string,
    actorId: string | undefined,
    toolIds: string[]
  ): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const toolId of toolIds) {
      try {
        const result = await prisma.aITool.updateMany({
          where: { id: toolId, companyId },
          data: { deletedAt: new Date() },
        });
        if (!result.count) {
          failed++;
          continue;
        }

        await AuditLogService.log({
          companyId,
          actorId,
          action: 'tool.bulk_delete',
          targetType: 'AITool',
          targetId: toolId,
        });

        deleted++;
      } catch (error) {
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Bulk delete risks
   */
  static async bulkDeleteRisks(
    companyId: string,
    actorId: string | undefined,
    riskIds: string[]
  ): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const riskId of riskIds) {
      try {
        const result = await prisma.risk.updateMany({
          where: { id: riskId, companyId },
          data: { deletedAt: new Date() },
        });
        if (!result.count) {
          failed++;
          continue;
        }

        await AuditLogService.log({
          companyId,
          actorId,
          action: 'risk.bulk_delete',
          targetType: 'Risk',
          targetId: riskId,
        });

        deleted++;
      } catch (error) {
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Bulk update tools
   */
  static async bulkUpdateTools(
    companyId: string,
    actorId: string | undefined,
    toolIds: string[],
    updates: Record<string, any>
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const toolId of toolIds) {
      try {
        await prisma.aITool.update({
          where: { id: toolId, companyId, deletedAt: null },
          data: updates as Prisma.AIToolUpdateInput,
        });

        await AuditLogService.log({
          companyId,
          actorId,
          action: 'tool.bulk_update',
          targetType: 'AITool',
          targetId: toolId,
          changes: updates,
        });

        updated++;
      } catch (error) {
        failed++;
      }
    }

    return { updated, failed };
  }

  /**
   * Bulk update risks
   */
  static async bulkUpdateRisks(
    companyId: string,
    actorId: string | undefined,
    riskIds: string[],
    updates: Record<string, any>
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const riskId of riskIds) {
      try {
        await prisma.risk.update({
          where: { id: riskId, companyId, deletedAt: null },
          data: updates as Prisma.RiskUpdateInput,
        });

        await AuditLogService.log({
          companyId,
          actorId,
          action: 'risk.bulk_update',
          targetType: 'Risk',
          targetId: riskId,
          changes: updates,
        });

        updated++;
      } catch (error) {
        failed++;
      }
    }

    return { updated, failed };
  }
}
