import { BulkOperationsService } from '../services/bulk-operations.service';
import { prisma } from '../services/prisma.client';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    aITool: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    risk: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };
  return { prisma: prismaMock };
});

describe('BulkOperationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('soft deletes tools and risks in bulk', async () => {
    jest.mocked((prisma as any).aITool.updateMany).mockResolvedValue({ count: 1 });
    jest.mocked((prisma as any).risk.updateMany).mockResolvedValue({ count: 1 });

    const tools = await BulkOperationsService.bulkDeleteTools('co-1', 'user-1', ['tool-1']);
    const risks = await BulkOperationsService.bulkDeleteRisks('co-1', 'user-1', ['risk-1']);

    expect(tools.deleted).toBe(1);
    expect(risks.deleted).toBe(1);
    expect(jest.mocked((prisma as any).aITool.updateMany).mock.calls[0][0].data).toEqual(
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
    expect(jest.mocked((prisma as any).risk.updateMany).mock.calls[0][0].data).toEqual(
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
  });
});
