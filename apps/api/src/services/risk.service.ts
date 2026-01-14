import { AuditLogService } from './audit-log.service';
import { prisma } from './prisma.client';
import { PaginationParams, PaginatedResponse, getSkip, getPaginationMeta } from '../utils/pagination';
import { buildSearchFilter, buildSortOrder } from '../utils/search';

export interface CreateRiskInput {
  title: string;
  description?: string;
  likelihood: number;
  impact: number;
  category: string;
  ownerId?: string;
  controlIds?: string[];
}

export interface DecisionInput {
  decision: 'ACCEPTED' | 'DEFERRED' | 'REJECTED';
  rationale?: string;
}

export class RiskService {
  static async list(
    companyId: string,
    options: {
      pagination?: PaginationParams;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      category?: string;
    } = {}
  ): Promise<PaginatedResponse<any>> {
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.limit || 20;
    const skip = getSkip(page, limit);

    const where: any = {
      companyId,
      deletedAt: null, // Soft delete filter
      ...(options.category && { category: options.category }),
      ...buildSearchFilter(options.search, ['title', 'description']),
    };

    const [risks, total] = await Promise.all([
      (prisma as any).risk.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildSortOrder(options.sortBy || 'updatedAt', options.sortOrder),
        include: {
          controls: {
            include: {
              control: true,
            },
          },
          decisions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      (prisma as any).risk.count({ where }),
    ]);

    return {
      data: risks,
      pagination: getPaginationMeta(page, limit, total),
    };
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateRiskInput) {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      const risk = await tx.risk.create({
        data: {
          companyId,
          title: input.title,
          description: input.description,
          likelihood: input.likelihood,
          impact: input.impact,
          category: input.category,
          ownerId: input.ownerId,
        },
      });

      // Create risk-control relationships if provided
      if (input.controlIds && input.controlIds.length > 0) {
        await tx.riskControl.createMany({
          data: input.controlIds.map((controlId) => ({
            riskId: risk.id,
            controlId,
          })),
        });
      }

      // Log audit trail
      await AuditLogService.log({
        companyId,
        actorId,
        action: 'risk.create',
        targetType: 'Risk',
        targetId: risk.id,
        changes: input as any,
      });

      // Return risk with controls
      return await tx.risk.findFirst({
        where: { id: risk.id, deletedAt: null }, // Soft delete filter
        include: {
          controls: {
            include: {
              control: true,
            },
          },
        },
      });
    });

    return result;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateRiskInput>) {
    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.likelihood !== undefined) updateData.likelihood = input.likelihood;
      if (input.impact !== undefined) updateData.impact = input.impact;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.ownerId !== undefined) updateData.ownerId = input.ownerId;

      const risk = await tx.risk.update({
        where: { id, companyId },
        data: updateData,
      });

      // Update controls if provided
      if (input.controlIds !== undefined) {
        await tx.riskControl.deleteMany({ where: { riskId: id } });
        if (input.controlIds.length > 0) {
          await tx.riskControl.createMany({
            data: input.controlIds.map((controlId) => ({
              riskId: id,
              controlId,
            })),
          });
        }
      }

      // Log audit trail
      await AuditLogService.log({
        companyId,
        actorId,
        action: 'risk.update',
        targetType: 'Risk',
        targetId: id,
        changes: input as any,
      });

      // Return updated risk with controls
      return await tx.risk.findUnique({
        where: { id },
        include: {
          controls: {
            include: {
              control: true,
            },
          },
        },
      });
    });

    return result;
  }

  static async delete(companyId: string, actorId: string | undefined, id: string) {
    // Soft delete
    await (prisma as any).risk.update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'risk.delete',
      targetType: 'Risk',
      targetId: id,
    });
  }

  static async addDecision(companyId: string, actorId: string | undefined, riskId: string, input: DecisionInput) {
    const decision = await (prisma as any).decisionLog.create({
      data: {
        companyId,
        riskId,
        decision: input.decision,
        rationale: input.rationale,
        approvedBy: actorId,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'risk.decision',
      targetType: 'DecisionLog',
      targetId: decision.id,
      changes: input as any,
    });

    return decision;
  }
}
