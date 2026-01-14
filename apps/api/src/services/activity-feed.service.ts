import { prisma } from './prisma.client';

export interface ActivityItem {
  id: string;
  type: 'tool' | 'risk' | 'incident' | 'policy' | 'control' | 'evidence';
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'approved' | 'rejected';
  targetId: string;
  targetName: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ActivityFeedService {
  /**
   * Get activity feed for company
   */
  static async getActivityFeed(
    companyId: string,
    options: {
      limit?: number;
      type?: ActivityItem['type'];
      since?: Date;
    } = {}
  ): Promise<ActivityItem[]> {
    const limit = options.limit || 50;
    const since = options.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        companyId,
        createdAt: { gte: since },
        ...(options.type && {
          targetType: options.type.toUpperCase() as any,
        }),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform audit logs to activity items
    const activities: ActivityItem[] = auditLogs
      .filter((log) => log.actor !== null && log.targetId !== null)
      .map((log) => {
        const action = this.mapAuditActionToActivity(log.action);
        const type = log.targetType.toLowerCase() as ActivityItem['type'];

        return {
          id: log.id,
          type,
          action,
          targetId: log.targetId!,
          targetName: (log as any).targetName || log.targetId || 'Unknown',
          actor: {
            id: log.actor!.id,
            name: log.actor!.name,
            email: log.actor!.email,
          },
          timestamp: log.createdAt,
          metadata: log.changes as Record<string, any>,
        };
      });

    return activities;
  }

  /**
   * Get activity for specific item
   */
  static async getItemActivity(
    companyId: string,
    targetType: string,
    targetId: string
  ): Promise<ActivityItem[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        companyId,
        targetType: targetType.toUpperCase(),
        targetId,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return auditLogs
      .filter((log) => log.actor !== null && log.targetId !== null)
      .map((log) => ({
        id: log.id,
        type: log.targetType.toLowerCase() as ActivityItem['type'],
        action: this.mapAuditActionToActivity(log.action),
        targetId: log.targetId!,
        targetName: (log as any).targetName || log.targetId || 'Unknown',
        actor: {
          id: log.actor!.id,
          name: log.actor!.name,
          email: log.actor!.email,
        },
        timestamp: log.createdAt,
        metadata: log.changes as Record<string, any>,
      }));
  }

  private static mapAuditActionToActivity(action: string): ActivityItem['action'] {
    if (action.includes('create')) return 'created';
    if (action.includes('update')) return 'updated';
    if (action.includes('delete')) return 'deleted';
    if (action.includes('comment')) return 'commented';
    if (action.includes('approve')) return 'approved';
    if (action.includes('reject')) return 'rejected';
    return 'updated';
  }
}
