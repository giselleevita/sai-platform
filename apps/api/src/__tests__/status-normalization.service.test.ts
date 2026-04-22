import { EvidenceService } from '../services/evidence.service';
import { GovernanceService } from '../services/governance.service';
import { prisma } from '../services/prisma.client';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    evidence: {
      create: jest.fn(),
      update: jest.fn(),
    },
    policy: {
      create: jest.fn(),
      update: jest.fn(),
    },
    control: {
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };
  return { prisma: prismaMock };
});

describe('Status normalization compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked((prisma as any).evidence.create).mockResolvedValue({ id: 'ev-1' });
    jest.mocked((prisma as any).evidence.update).mockResolvedValue({ id: 'ev-1' });
    jest.mocked((prisma as any).policy.create).mockResolvedValue({ id: 'pol-1' });
    jest.mocked((prisma as any).control.create).mockResolvedValue({ id: 'ctrl-1' });
  });

  it('maps legacy evidence statuses to canonical values', async () => {
    await EvidenceService.create('co-1', 'user-1', {
      controlId: 'ctrl-1',
      source: 'Upload',
      status: 'PENDING',
    });

    const createCall = jest.mocked((prisma as any).evidence.create).mock.calls[0][0];
    expect(createCall.data.status).toBe('SUBMITTED');
  });

  it('maps deprecated lifecycle status to RETIRED for policy/control', async () => {
    await GovernanceService.createPolicy('co-1', 'user-1', {
      name: 'Policy',
      status: 'DEPRECATED' as any,
    });
    await GovernanceService.createControl('co-1', 'user-1', {
      name: 'Control',
      status: 'DEPRECATED' as any,
    });

    const policyCall = jest.mocked((prisma as any).policy.create).mock.calls[0][0];
    const controlCall = jest.mocked((prisma as any).control.create).mock.calls[0][0];
    expect(policyCall.data.status).toBe('RETIRED');
    expect(controlCall.data.status).toBe('RETIRED');
  });
});
