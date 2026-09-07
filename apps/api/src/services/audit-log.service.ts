import { prisma } from './prisma.client';

export interface AuditLogInput {
  companyId: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  changes?: Record<string, unknown>;
}

export interface AuditLogQuery {
  action?: string;
  targetType?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
}

export const AUDIT_PAGE_SIZE_DEFAULT = 50;
export const AUDIT_PAGE_SIZE_MAX = 200;

export interface AuditLogFacets {
  actions: string[];
  targetTypes: string[];
  actors: { id: string; name: string; email: string }[];
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

  /**
   * The audit trail is the one screen where a silently truncated list is
   * worse than no list at all, so this pages with a cursor instead of
   * cutting the tail off at some arbitrary take.
   */
  static async search(companyId: string, query: AuditLogQuery = {}) {
    const limit = Math.min(
      Math.max(Math.trunc(query.limit ?? AUDIT_PAGE_SIZE_DEFAULT), 1),
      AUDIT_PAGE_SIZE_MAX
    );

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (query.from) createdAt.gte = query.from;
    if (query.to) createdAt.lte = query.to;

    const where = {
      companyId,
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    // One extra row tells us whether another page exists without a
    // second count query over an append-only table.
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    const entries = rows.slice(0, limit);
    return {
      entries,
      nextCursor: rows.length > limit ? entries[entries.length - 1].id : null,
    };
  }

  /**
   * The values that actually occur in this tenant's trail, so the filters
   * offer real choices rather than a hardcoded list that drifts.
   */
  static async facets(companyId: string): Promise<AuditLogFacets> {
    const [actions, targetTypes, actorIds] = await Promise.all([
      prisma.auditLog.findMany({
        where: { companyId },
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        distinct: ['targetType'],
        select: { targetType: true },
        orderBy: { targetType: 'asc' },
      }),
      prisma.auditLog.findMany({
        where: { companyId, actorId: { not: null } },
        distinct: ['actorId'],
        select: { actorId: true },
      }),
    ]);

    const ids = actorIds.map((row) => row.actorId).filter((id): id is string => Boolean(id));
    const actors = ids.length
      ? await prisma.user.findMany({
          where: { id: { in: ids }, companyId },
          select: { id: true, name: true, email: true },
          orderBy: { name: 'asc' },
        })
      : [];

    return {
      actions: actions.map((row) => row.action),
      targetTypes: targetTypes.map((row) => row.targetType),
      actors,
    };
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
