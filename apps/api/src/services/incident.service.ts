import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';

export interface CreateIncidentInput {
  title: string;
  description?: string;
  severity: string;
  status?: 'DETECTED' | 'CLASSIFIED' | 'ESCALATED' | 'RESOLVED' | 'REVIEWED';
  detectedAt?: string;
  resolvedAt?: string;
  reportedAt?: string;
  ownerId?: string;
  toolId?: string; // Which AI tool was misused
  reportedBy?: string; // User who reported the incident
}

export class IncidentService {
  static async list(
    companyId: string,
    options: {
      pagination?: { page?: number; limit?: number };
      search?: string;
      status?: string;
    } = {}
  ) {
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      deletedAt: null, // Soft delete filter
      ...(options.status && options.status !== 'All' && { status: options.status }),
      ...(options.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      data: incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  static async create(companyId: string, actorId: string | undefined, input: CreateIncidentInput) {
    // Use actorId as reportedBy if not provided
    const reportedBy = input.reportedBy || actorId;
    
    const incident = await prisma.incident.create({
      data: {
        companyId,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: input.status || 'DETECTED',
        detectedAt: input.detectedAt ? new Date(input.detectedAt) : new Date(),
        resolvedAt: input.resolvedAt ? new Date(input.resolvedAt) : undefined,
        reportedAt: input.reportedAt ? new Date(input.reportedAt) : new Date(),
        ownerId: input.ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'incident.create',
      targetType: 'Incident',
      targetId: incident.id,
      changes: input as any,
    });

    return incident;
  }

  static async update(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateIncidentInput>) {
    // Check soft delete first
    const existing = await prisma.incident.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Incident not found or deleted');
    }

    const incident = await prisma.incident.update({
      where: { id, companyId },
      data: {
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: input.status,
        detectedAt: input.detectedAt ? new Date(input.detectedAt) : undefined,
        resolvedAt: input.resolvedAt ? new Date(input.resolvedAt) : undefined,
        reportedAt: input.reportedAt ? new Date(input.reportedAt) : undefined,
        ownerId: input.ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'incident.update',
      targetType: 'Incident',
      targetId: id,
      changes: input as any,
    });

    return incident;
  }

  static async delete(companyId: string, actorId: string | undefined, id: string) {
    // Soft delete
    await prisma.incident.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'incident.delete',
      targetType: 'Incident',
      targetId: id,
    });
  }
}
