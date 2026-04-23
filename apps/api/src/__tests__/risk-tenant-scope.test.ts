/**
 * Regression guard: risk list queries must always include tenant (company) scope.
 */
jest.mock('../services/prisma.client', () => ({
  prisma: {
    risk: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

import { RiskService } from '../services/risk.service';
import { prisma } from '../services/prisma.client';

describe('RiskService tenant scope', () => {
  beforeEach(() => {
    jest.mocked((prisma as any).risk.findMany).mockClear();
    jest.mocked((prisma as any).risk.count).mockClear();
  });

  it('passes companyId into Prisma where for list', async () => {
    await RiskService.list('cmp_risk_scope_1');
    expect((prisma as any).risk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'cmp_risk_scope_1',
          deletedAt: null,
        }),
      }),
    );
    expect((prisma as any).risk.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'cmp_risk_scope_1' }),
      }),
    );
  });
});
