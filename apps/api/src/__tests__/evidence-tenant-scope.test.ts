/**
 * Regression guard: evidence list queries must always include tenant (company) scope.
 */
jest.mock('../services/prisma.client', () => ({
  prisma: {
    evidence: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { EvidenceService } from '../services/evidence.service';
import { prisma } from '../services/prisma.client';

describe('EvidenceService tenant scope', () => {
  beforeEach(() => {
    jest.mocked((prisma as any).evidence.findMany).mockClear();
  });

  it('passes companyId into Prisma where for list', async () => {
    await EvidenceService.list('cmp_evidence_scope_1');
    expect((prisma as any).evidence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'cmp_evidence_scope_1' }),
      }),
    );
  });
});
