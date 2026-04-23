/**
 * Regression guard: exception list queries must always include tenant (company) scope.
 */
jest.mock('../services/prisma.client', () => ({
  prisma: {
    exception: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { ExceptionService } from '../services/exception.service';
import { prisma } from '../services/prisma.client';

describe('ExceptionService tenant scope', () => {
  beforeEach(() => {
    jest.mocked((prisma as any).exception.findMany).mockClear();
  });

  it('passes companyId into Prisma where for list', async () => {
    await ExceptionService.list('cmp_exception_scope_1');
    expect((prisma as any).exception.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'cmp_exception_scope_1' }),
      }),
    );
  });
});
