import { GovernanceFlowService } from '../services/governance.service';
import { prisma } from '../services/prisma.client';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    aITool: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock)),
  };
  return { prisma: prismaMock };
});

describe('GovernanceFlowService', () => {
  beforeEach(() => {
    jest.mocked(prisma.aITool.findFirst).mockReset();
    jest.mocked(prisma.aITool.update).mockReset();
    jest.mocked(prisma.auditLog.create).mockClear();
    jest.mocked(prisma.$transaction).mockImplementation((fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma as any),
    );
  });

  it('getGovernance returns stored profile from customFields', async () => {
    jest.mocked(prisma.aITool.findFirst).mockResolvedValue({
      id: 'tool-1',
      companyId: 'co-1',
      customFields: {
        toolGovernance: {
          profile: {
            decisionStatus: 'Accepted',
            complianceStatus: 'Compliant',
            applicablePolicies: ['AI Usage Policy'],
          },
        },
      },
    } as any);

    const g = await GovernanceFlowService.getGovernance('tool-1', 'co-1');
    expect(g).toMatchObject({
      decisionStatus: 'Accepted',
      complianceStatus: 'Compliant',
      applicablePolicies: ['AI Usage Policy'],
    });
  });

  it('listDecisionLogs returns logs newest first', async () => {
    jest.mocked(prisma.aITool.findFirst).mockResolvedValue({
      id: 'tool-1',
      companyId: 'co-1',
      customFields: {
        toolGovernance: {
          decisionLogs: [
            {
              id: 'a',
              decision: 'older',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 'b',
              decision: 'newer',
              createdAt: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      },
    } as any);

    const logs = await GovernanceFlowService.listDecisionLogs('tool-1', 'co-1');
    expect(logs.map((l) => l.decision)).toEqual(['newer', 'older']);
  });

  it('addDecisionLog appends entry and writes audit log', async () => {
    jest.mocked(prisma.aITool.findFirst).mockResolvedValue({
      id: 'tool-1',
      companyId: 'co-1',
      customFields: { other: true },
    } as any);
    jest.mocked(prisma.aITool.update).mockResolvedValue({} as any);

    const row = await GovernanceFlowService.addDecisionLog('tool-1', 'co-1', {
      decision: 'Approved for pilot',
      rationale: 'Low risk',
      ownerId: 'user-1',
    });

    expect(row.decision).toBe('Approved for pilot');
    expect(row.rationale).toBe('Low risk');
    expect(row.ownerId).toBe('user-1');
    expect(row.id).toBeDefined();
    expect(row.createdAt).toBeDefined();

    expect(prisma.aITool.update).toHaveBeenCalled();
    const updateArg = jest.mocked(prisma.aITool.update).mock.calls[0][0];
    const cf = updateArg.data.customFields as Record<string, unknown>;
    const tg = cf.toolGovernance as { decisionLogs: { decision: string }[] };
    expect(tg.decisionLogs).toHaveLength(1);
    expect(tg.decisionLogs[0].decision).toBe('Approved for pilot');

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'inventory.tool.decisionLog.create',
          targetType: 'AITool',
          targetId: 'tool-1',
        }),
      }),
    );
  });

  it('upsertGovernance merges profile fields', async () => {
    jest.mocked(prisma.aITool.findFirst).mockResolvedValue({
      id: 'tool-1',
      companyId: 'co-1',
      customFields: {
        toolGovernance: {
          profile: { decisionStatus: 'Pending' },
          decisionLogs: [],
        },
      },
    } as any);
    jest.mocked(prisma.aITool.update).mockResolvedValue({} as any);

    const profile = await GovernanceFlowService.upsertGovernance('tool-1', 'co-1', {
      decisionStatus: 'Accepted',
      complianceStatus: 'OK',
    });

    expect(profile.decisionStatus).toBe('Accepted');
    expect(profile.complianceStatus).toBe('OK');
    expect(prisma.aITool.update).toHaveBeenCalled();
  });
});
