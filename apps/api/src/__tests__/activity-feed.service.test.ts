import { ActivityFeedService } from '../services/activity-feed.service';
import { prisma } from '../services/prisma.client';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    auditLog: {
      findMany: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

describe('ActivityFeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps API type filter to audit target type', async () => {
    jest.mocked((prisma as any).auditLog.findMany).mockResolvedValue([]);
    await ActivityFeedService.getActivityFeed('co-1', { type: 'tool' });
    const call = jest.mocked((prisma as any).auditLog.findMany).mock.calls[0][0];
    expect(call.where.targetType).toBe('AITool');
  });

  it('maps audit target types back to API activity types', async () => {
    jest.mocked((prisma as any).auditLog.findMany).mockResolvedValue([
      {
        id: '1',
        action: 'policy.create',
        targetType: 'Policy',
        targetId: 'p-1',
        createdAt: new Date(),
        actor: { id: 'u-1', name: 'User', email: 'u@example.com' },
        changes: {},
      },
      {
        id: '2',
        action: 'tool.create',
        targetType: 'AITool',
        targetId: 't-1',
        createdAt: new Date(),
        actor: { id: 'u-1', name: 'User', email: 'u@example.com' },
        changes: {},
      },
    ]);

    const items = await ActivityFeedService.getActivityFeed('co-1');
    expect(items.map((x) => x.type)).toEqual(['policy', 'tool']);
  });
});
