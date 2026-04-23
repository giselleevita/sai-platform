/**
 * Regression guard: vendor list queries must always include tenant (company) scope.
 */
jest.mock('../services/prisma.client', () => ({
  prisma: {
    vendor: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { VendorService } from '../services/vendor.service';
import { prisma } from '../services/prisma.client';

describe('VendorService tenant scope', () => {
  beforeEach(() => {
    jest.mocked((prisma as any).vendor.findMany).mockClear();
  });

  it('passes companyId into Prisma where for list', async () => {
    await VendorService.list('cmp_vendor_scope_1');
    expect((prisma as any).vendor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'cmp_vendor_scope_1' }),
      }),
    );
  });
});
