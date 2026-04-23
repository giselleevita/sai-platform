import { InvitationsService } from '../services/invitations.service';
import { prisma } from '../services/prisma.client';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    invitation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };
  return { prisma: prismaMock };
});

describe('InvitationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an invitation and returns a one-time token', async () => {
    jest.mocked((prisma as any).invitation.findFirst).mockResolvedValue(null);
    jest.mocked((prisma as any).invitation.create).mockResolvedValue({
      id: 'inv-1',
      companyId: 'co-1',
      email: 'user@example.com',
      role: 'OPERATOR',
      expiresAt: new Date(Date.now() + 7 * 86400_000),
      acceptedAt: null,
      revokedAt: null,
      invitedByUserId: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { invitation, token } = await InvitationsService.createInvitation('co-1', 'admin-1', {
      email: 'USER@example.com',
      role: 'OPERATOR',
      expiresInDays: 7,
    });

    expect(invitation.id).toBe('inv-1');
    expect(invitation.email).toBe('user@example.com');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('rejects creating an invitation if an active one exists', async () => {
    jest.mocked((prisma as any).invitation.findFirst).mockResolvedValue({ id: 'inv-existing' });
    await expect(
      InvitationsService.createInvitation('co-1', 'admin-1', {
        email: 'user@example.com',
        role: 'OPERATOR',
      }),
    ).rejects.toThrow('active invitation');
  });

  it('accepts invitation by token and marks acceptedAt', async () => {
    jest.mocked((prisma as any).invitation.findFirst).mockResolvedValue({
      id: 'inv-2',
      companyId: 'co-9',
      email: 'user@example.com',
      role: 'ADMIN',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400_000),
      acceptedAt: null,
      revokedAt: null,
      invitedByUserId: 'admin-1',
    });
    jest.mocked((prisma as any).invitation.update).mockResolvedValue({});

    const out = await InvitationsService.acceptInvitationByToken({
      email: 'user@example.com',
      token: 'token',
    });

    expect(out.companyId).toBe('co-9');
    expect(out.role).toBe('ADMIN');
    expect(jest.mocked((prisma as any).invitation.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-2' },
        data: expect.objectContaining({ acceptedAt: expect.any(Date) }),
      }),
    );
  });
});

