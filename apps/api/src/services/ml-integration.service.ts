import { prisma } from './prisma.client';
import { CacheService } from './cache.service';

type MLIntegrationRow = any;

export interface CreateMLIntegrationInput {
  provider: 'MLFLOW' | 'SAGEMAKER' | 'VERTEX_AI' | 'OTHER';
  displayName: string;
  status?: 'ACTIVE' | 'DISABLED' | 'ERROR';
  config?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateMLIntegrationInput extends Partial<CreateMLIntegrationInput> {}

export class MLIntegrationService {
  static async listByCompany(companyId: string): Promise<MLIntegrationRow[]> {
    const cacheKey = `company:${companyId}:ml-integrations`;
    const cached = await CacheService.get<MLIntegrationRow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await (prisma as any).mlIntegration.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    await CacheService.set(cacheKey, rows, 300);
    return rows;
  }

  static async create(companyId: string, input: CreateMLIntegrationInput): Promise<MLIntegrationRow> {
    const row = await (prisma as any).mlIntegration.create({
      data: {
        companyId,
        provider: input.provider,
        displayName: input.displayName,
        status: input.status ?? 'ACTIVE',
        config: input.config ?? {},
        notes: input.notes ?? null,
      },
    });

    await CacheService.invalidateCompany(companyId);
    return row;
  }

  static async update(
    companyId: string,
    id: string,
    input: UpdateMLIntegrationInput
  ): Promise<MLIntegrationRow | null> {
    const row = await (prisma as any).mlIntegration.update({
      where: { id, companyId },
      data: {
        provider: input.provider,
        displayName: input.displayName,
        status: input.status,
        config: input.config,
        notes: input.notes,
      },
    });

    await CacheService.invalidateCompany(companyId);
    return row;
  }

  static async delete(companyId: string, id: string): Promise<void> {
    await (prisma as any).mlIntegration.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: 'DISABLED' },
    });

    await CacheService.invalidateCompany(companyId);
  }
}
