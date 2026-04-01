import { prisma } from './prisma.client';

export interface UpsertGPAIInput {
  provider: 'MLFLOW' | 'SAGEMAKER' | 'VERTEX_AI' | 'OTHER';
  displayName: string;
  modelFamily: string;
  transparencySummary?: string;
  euDeclarationRef?: string;
  status?: 'ACTIVE' | 'DISABLED' | 'ERROR';
}

export class GpaiService {
  static async list(companyId: string) {
    const rows = await (prisma as any).mLIntegration.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row: any) => ({
      id: row.id,
      provider: row.provider,
      displayName: row.displayName,
      status: row.status,
      modelFamily: row.config?.modelFamily || null,
      transparencySummary: row.config?.transparencySummary || null,
      euDeclarationRef: row.config?.euDeclarationRef || null,
      lastSyncedAt: row.lastSyncedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  static async create(companyId: string, input: UpsertGPAIInput) {
    const row = await (prisma as any).mLIntegration.create({
      data: {
        companyId,
        provider: input.provider,
        displayName: input.displayName,
        status: input.status || 'ACTIVE',
        config: {
          modelFamily: input.modelFamily,
          transparencySummary: input.transparencySummary || null,
          euDeclarationRef: input.euDeclarationRef || null,
        },
      },
    });
    return row;
  }
}