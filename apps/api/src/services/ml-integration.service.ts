import { MLIntegration } from '@prisma/client';
import { prisma } from './prisma.client';
import { CacheService } from './cache.service';

export interface CreateMLIntegrationInput {
  provider: 'MLFLOW' | 'SAGEMAKER' | 'VERTEX_AI' | 'OTHER';
  displayName: string;
  status?: 'ACTIVE' | 'DISABLED' | 'ERROR';
  config?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateMLIntegrationInput extends Partial<CreateMLIntegrationInput> {}

export class MLIntegrationService {
  static async listByCompany(companyId: string): Promise<MLIntegration[]> {
    const cacheKey = `company:${companyId}:ml-integrations`;
    const cached = await CacheService.get<MLIntegration[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await prisma.mLIntegration.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    await CacheService.set(cacheKey, rows, 300);
    return rows;
  }

  static async create(companyId: string, input: CreateMLIntegrationInput): Promise<MLIntegration> {
    const row = await prisma.mLIntegration.create({
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
  ): Promise<MLIntegration | null> {
    const row = await prisma.mLIntegration.update({
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
    await prisma.mLIntegration.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: 'DISABLED' },
    });

    await CacheService.invalidateCompany(companyId);
  }
}
