/**
 * Regression guard: inventory queries must always include tenant (company) scope.
 */
jest.mock('../services/cache.service', () => ({
  CacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../services/prisma.client', () => ({
  prisma: {
    aITool: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

import { AIToolService } from '../services/ai-tool.service';
import { prisma } from '../services/prisma.client';

describe('AIToolService tenant scope', () => {
  beforeEach(() => {
    jest.mocked(prisma.aITool.findMany).mockClear();
    jest.mocked(prisma.aITool.count).mockClear();
  });

  it('passes companyId into Prisma where for list', async () => {
    await AIToolService.getToolsByCompany('cmp_test_123');
    expect(prisma.aITool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'cmp_test_123',
          deletedAt: null,
        }),
      }),
    );
    expect(prisma.aITool.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'cmp_test_123' }),
      }),
    );
  });
});
