import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';

export class IntegrationConnectorService {
  static list(companyId: string) {
    return prisma.integrationConnector.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(
    companyId: string,
    actorId: string | undefined,
    input: { type: string; name: string; enabled?: boolean; config?: Record<string, unknown> }
  ) {
    const row = await prisma.integrationConnector.create({
      data: {
        companyId,
        type: input.type,
        name: input.name,
        enabled: input.enabled ?? false,
        config: (input.config ?? {}) as object,
      },
    });
    await AuditLogService.log({
      companyId,
      actorId,
      action: 'integration.connector.create',
      targetType: 'IntegrationConnector',
      targetId: row.id,
      changes: input as unknown as Record<string, unknown>,
    });
    return row;
  }

  static async update(
    companyId: string,
    actorId: string | undefined,
    id: string,
    input: { name?: string; enabled?: boolean; config?: Record<string, unknown> }
  ) {
    const row = await prisma.integrationConnector.update({
      where: { id, companyId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.config !== undefined ? { config: input.config as object } : {}),
      },
    });
    await AuditLogService.log({
      companyId,
      actorId,
      action: 'integration.connector.update',
      targetType: 'IntegrationConnector',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });
    return row;
  }
}
