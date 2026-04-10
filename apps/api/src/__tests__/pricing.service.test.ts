jest.mock('../services/audit-log.service', () => ({
  AuditLogService: {
    log: jest.fn(),
    listByAction: jest.fn(),
    listByTarget: jest.fn(),
    listByTargetIds: jest.fn(),
  },
}));

jest.mock('../services/webhooks.service', () => ({
  WebhooksService: {
    triggerWebhook: jest.fn(),
  },
}));

import { PricingService } from '../services/pricing.service';
import { AuditLogService } from '../services/audit-log.service';
import { WebhooksService } from '../services/webhooks.service';

describe('PricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures a durable pricing quote request', async () => {
    const result = await PricingService.createQuoteRequest({
      companyId: 'company-1',
      actorId: 'user-1',
      tier: 'mid-market',
      aiTools: 30,
      frameworks: ['EU AI Act', 'NIS2'],
      advancedGovernance: true,
      stakeholderCount: 12,
      notes: 'Pilot quote for Q2 rollout',
    });

    expect(result.requestId).toBeTruthy();
    expect(result.quote.total).toBe(26000);
    expect(AuditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        actorId: 'user-1',
        action: 'pricing.quote.requested',
        targetType: 'PricingQuote',
      })
    );
    expect(WebhooksService.triggerWebhook).toHaveBeenCalledWith(
      'company-1',
      'pricing.quote.requested',
      expect.objectContaining({
        estimatedAnnualValue: 26000,
        frameworkCount: 2,
      })
    );
  });

  it('lists recent pricing quote requests', async () => {
    const createdAt = new Date('2026-04-10T10:00:00.000Z');
    (AuditLogService.listByAction as jest.Mock).mockResolvedValue([
      {
        companyId: 'company-1',
        actorId: 'user-1',
        action: 'pricing.quote.requested',
        targetType: 'PricingQuote',
        targetId: 'quote-1',
        createdAt,
        changes: {
          input: {
            tier: 'mid-market',
            aiTools: 30,
            frameworks: ['EU AI Act'],
            advancedGovernance: false,
            notes: 'Initial contact',
          },
          quote: {
            total: 16000,
            breakdown: {
              baseSubscription: 12000,
              toolScaling: 4000,
              frameworks: 0,
              advancedGovernance: 0,
            },
          },
          estimatedAnnualValue: 16000,
        },
      },
    ]);
    (AuditLogService.listByTargetIds as jest.Mock).mockResolvedValue([
      {
        companyId: 'company-1',
        actorId: 'user-1',
        action: 'pricing.quote.requested',
        targetType: 'PricingQuote',
        targetId: 'quote-1',
        createdAt,
        changes: {
          input: {
            tier: 'mid-market',
            aiTools: 30,
            frameworks: ['EU AI Act'],
            advancedGovernance: false,
            notes: 'Initial contact',
          },
          quote: {
            total: 16000,
            breakdown: {
              baseSubscription: 12000,
              toolScaling: 4000,
              frameworks: 0,
              advancedGovernance: 0,
            },
          },
          estimatedAnnualValue: 16000,
        },
      },
    ]);

    const rows = await PricingService.listQuoteRequests('company-1');

    expect(AuditLogService.listByAction).toHaveBeenCalledWith(
      'company-1',
      'pricing.quote.requested',
      'PricingQuote',
      25
    );
    expect(AuditLogService.listByTargetIds).toHaveBeenCalledWith(
      'company-1',
      'PricingQuote',
      ['quote-1']
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        requestId: 'quote-1',
        status: 'REQUESTED',
        estimatedAnnualValue: 16000,
        notes: 'Initial contact',
      })
    );
  });

  it('updates quote lifecycle state with a valid transition', async () => {
    const createdAt = new Date('2026-04-10T10:00:00.000Z');
    const updatedAt = new Date('2026-04-11T10:00:00.000Z');

    (AuditLogService.listByTarget as jest.Mock)
      .mockResolvedValueOnce([
        {
          companyId: 'company-1',
          actorId: 'user-1',
          action: 'pricing.quote.requested',
          targetType: 'PricingQuote',
          targetId: 'quote-1',
          createdAt,
          changes: {
            input: {
              tier: 'mid-market',
              aiTools: 30,
              frameworks: [],
              advancedGovernance: false,
            },
            quote: {
              total: 16000,
              breakdown: {
                baseSubscription: 12000,
                toolScaling: 4000,
                frameworks: 0,
                advancedGovernance: 0,
              },
            },
            estimatedAnnualValue: 16000,
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          companyId: 'company-1',
          actorId: 'user-1',
          action: 'pricing.quote.requested',
          targetType: 'PricingQuote',
          targetId: 'quote-1',
          createdAt,
          changes: {
            input: {
              tier: 'mid-market',
              aiTools: 30,
              frameworks: [],
              advancedGovernance: false,
            },
            quote: {
              total: 16000,
              breakdown: {
                baseSubscription: 12000,
                toolScaling: 4000,
                frameworks: 0,
                advancedGovernance: 0,
              },
            },
            estimatedAnnualValue: 16000,
          },
        },
        {
          companyId: 'company-1',
          actorId: 'user-2',
          action: 'pricing.quote.lifecycle.updated',
          targetType: 'PricingQuote',
          targetId: 'quote-1',
          createdAt: updatedAt,
          changes: {
            previousStatus: 'REQUESTED',
            lifecycle: {
              status: 'QUALIFIED',
              ownerId: 'sales-1',
              followUpAt: '2026-04-15T10:00:00.000Z',
              notes: 'Book discovery call',
            },
          },
        },
      ]);

    const updated = await PricingService.updateQuoteLifecycle({
      companyId: 'company-1',
      actorId: 'user-2',
      requestId: 'quote-1',
      status: 'QUALIFIED',
      ownerId: 'sales-1',
      followUpAt: '2026-04-15T10:00:00.000Z',
      notes: 'Book discovery call',
    });

    expect(AuditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'pricing.quote.lifecycle.updated',
        targetId: 'quote-1',
      })
    );
    expect(WebhooksService.triggerWebhook).toHaveBeenCalledWith(
      'company-1',
      'pricing.quote.lifecycle.updated',
      expect.objectContaining({
        requestId: 'quote-1',
        previousStatus: 'REQUESTED',
        status: 'QUALIFIED',
      })
    );
    expect(updated).toEqual(
      expect.objectContaining({
        requestId: 'quote-1',
        status: 'QUALIFIED',
        ownerId: 'sales-1',
        followUpAt: '2026-04-15T10:00:00.000Z',
        notes: 'Book discovery call',
      })
    );
  });

  it('rejects invalid quote lifecycle transitions', async () => {
    const createdAt = new Date('2026-04-10T10:00:00.000Z');
    const closedAt = new Date('2026-04-11T10:00:00.000Z');

    (AuditLogService.listByTarget as jest.Mock).mockResolvedValue([
      {
        companyId: 'company-1',
        actorId: 'user-1',
        action: 'pricing.quote.requested',
        targetType: 'PricingQuote',
        targetId: 'quote-1',
        createdAt,
        changes: {
          input: {
            tier: 'mid-market',
            aiTools: 30,
            frameworks: [],
            advancedGovernance: false,
          },
          quote: {
            total: 16000,
            breakdown: {
              baseSubscription: 12000,
              toolScaling: 4000,
              frameworks: 0,
              advancedGovernance: 0,
            },
          },
          estimatedAnnualValue: 16000,
        },
      },
      {
        companyId: 'company-1',
        actorId: 'user-2',
        action: 'pricing.quote.lifecycle.updated',
        targetType: 'PricingQuote',
        targetId: 'quote-1',
        createdAt: closedAt,
        changes: {
          previousStatus: 'REQUESTED',
          lifecycle: {
            status: 'CLOSED_LOST',
          },
        },
      },
    ]);

    await expect(
      PricingService.updateQuoteLifecycle({
        companyId: 'company-1',
        actorId: 'user-2',
        requestId: 'quote-1',
        status: 'QUALIFIED',
      })
    ).rejects.toThrow('Invalid pricing quote transition from CLOSED_LOST to QUALIFIED');
  });
});