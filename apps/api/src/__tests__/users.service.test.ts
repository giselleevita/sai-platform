import { UsersService } from '../services/users.service';
import { prisma } from '../services/prisma.client';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    user: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };
  return { prisma: prismaMock };
});

describe('UsersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users by companyId', async () => {
    jest.mocked((prisma as any).user.findMany).mockResolvedValue([{ id: 'u1' }]);
    const rows = await UsersService.listUsers('co-1');
    expect(rows).toHaveLength(1);
    expect(jest.mocked((prisma as any).user.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'co-1' } }),
    );
  });

  it('disables a user and writes audit log', async () => {
    jest.mocked((prisma as any).user.updateMany).mockResolvedValue({ count: 1 });
    jest.mocked((prisma as any).user.findUnique).mockResolvedValue({ id: 'u2', disabledAt: new Date() });

    const out = await UsersService.updateUser('co-1', 'admin-1', 'u2', { disabled: true });
    expect(out).not.toBeNull();
    expect(out!.id).toBe('u2');
    expect(jest.mocked((prisma as any).user.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2', companyId: 'co-1' },
        data: expect.objectContaining({ disabledAt: expect.any(Date) }),
      }),
    );
  });
});

