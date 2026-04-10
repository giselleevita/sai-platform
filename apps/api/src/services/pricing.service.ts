import { randomUUID } from 'crypto';
import { computePricing, type PricingInput } from '../config/pricing';
import { AuditLogService } from './audit-log.service';
import { WebhooksService } from './webhooks.service';
import { logger } from '../utils/logger';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export interface PricingQuoteRequestInput extends PricingInput {
  companyId: string;
  actorId?: string;
  stakeholderCount?: number;
  targetGoLive?: string;
  notes?: string;
}

export type PricingQuoteStatus =
  | 'REQUESTED'
  | 'QUALIFIED'
  | 'DISCOVERY'
  | 'PILOT_PROPOSED'
  | 'PILOT_ACTIVE'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface PricingQuoteLifecycleUpdateInput {
  companyId: string;
  actorId?: string;
  requestId: string;
  status?: PricingQuoteStatus;
  ownerId?: string;
  followUpAt?: string | null;
  notes?: string;
  reason?: string;
}

export interface PricingQuoteView {
  requestId: string;
  companyId: string;
  actorId?: string;
  createdAt: string;
  updatedAt: string;
  status: PricingQuoteStatus;
  ownerId?: string;
  followUpAt?: string | null;
  notes?: string;
  tier: PricingInput['tier'];
  aiTools: number;
  frameworks: string[];
  advancedGovernance: boolean;
  stakeholderCount?: number;
  targetGoLive?: string;
  estimatedAnnualValue: number | null;
  quote: ReturnType<typeof computePricing>;
  history: Array<{
    action: string;
    actorId?: string;
    createdAt: string;
    changes?: Record<string, unknown>;
  }>;
}

const PRICING_QUOTE_TARGET = 'PricingQuote';
const PRICING_QUOTE_ACTION = 'pricing.quote.requested';
const PRICING_QUOTE_UPDATED_ACTION = 'pricing.quote.lifecycle.updated';

const QUOTE_STATUS_TRANSITIONS: Record<PricingQuoteStatus, PricingQuoteStatus[]> = {
  REQUESTED: ['QUALIFIED', 'DISCOVERY', 'CLOSED_LOST'],
  QUALIFIED: ['DISCOVERY', 'PILOT_PROPOSED', 'CLOSED_LOST'],
  DISCOVERY: ['PILOT_PROPOSED', 'PILOT_ACTIVE', 'CLOSED_LOST'],
  PILOT_PROPOSED: ['PILOT_ACTIVE', 'CLOSED_WON', 'CLOSED_LOST'],
  PILOT_ACTIVE: ['CLOSED_WON', 'CLOSED_LOST'],
  CLOSED_WON: [],
  CLOSED_LOST: [],
};

export class PricingService {
  static async createQuoteRequest(input: PricingQuoteRequestInput) {
    const quote = computePricing({
      tier: input.tier,
      aiTools: input.aiTools,
      frameworks: input.frameworks,
      advancedGovernance: input.advancedGovernance,
    });

    const requestId = randomUUID();
    const estimatedAnnualValue = typeof quote.total === 'number' ? quote.total : null;

    await AuditLogService.log({
      companyId: input.companyId,
      actorId: input.actorId,
      action: PRICING_QUOTE_ACTION,
      targetType: PRICING_QUOTE_TARGET,
      targetId: requestId,
      changes: {
        requestId,
        input: {
          tier: input.tier,
          aiTools: input.aiTools,
          frameworks: input.frameworks,
          advancedGovernance: input.advancedGovernance,
          stakeholderCount: input.stakeholderCount,
          targetGoLive: input.targetGoLive,
          notes: input.notes,
        },
        quote,
        estimatedAnnualValue,
      },
    });

    try {
      await WebhooksService.triggerWebhook(input.companyId, PRICING_QUOTE_ACTION, {
        requestId,
        tier: input.tier,
        aiTools: input.aiTools,
        frameworkCount: input.frameworks.length,
        advancedGovernance: input.advancedGovernance,
        stakeholderCount: input.stakeholderCount,
        targetGoLive: input.targetGoLive,
        estimatedAnnualValue,
      });
    } catch (error) {
      logger.warn('Failed to dispatch pricing quote webhook', {
        companyId: input.companyId,
        requestId,
        error,
      });
    }

    return {
      requestId,
      quote,
      estimatedAnnualValue,
    };
  }

  static async listQuoteRequests(companyId: string, take = 25): Promise<PricingQuoteView[]> {
    const requestLogs = await AuditLogService.listByAction(
      companyId,
      PRICING_QUOTE_ACTION,
      PRICING_QUOTE_TARGET,
      take
    );
    const requestIds = requestLogs
      .map((log) => log.targetId)
      .filter((targetId): targetId is string => Boolean(targetId));

    const allLogs = await AuditLogService.listByTargetIds(companyId, PRICING_QUOTE_TARGET, requestIds);
    const grouped = new Map<string, typeof allLogs>();

    for (const log of allLogs) {
      if (!log.targetId) {
        continue;
      }
      const existing = grouped.get(log.targetId) ?? [];
      existing.push(log);
      grouped.set(log.targetId, existing);
    }

    return requestIds
      .map((requestId) => grouped.get(requestId))
      .filter((logs): logs is NonNullable<typeof logs> => Boolean(logs))
      .map((logs) => this.materializeQuote(logs));
  }

  static async getQuoteRequest(companyId: string, requestId: string): Promise<PricingQuoteView> {
    const logs = await AuditLogService.listByTarget(companyId, PRICING_QUOTE_TARGET, requestId);
    if (logs.length === 0) {
      throw new NotFoundError('Pricing quote request not found');
    }

    return this.materializeQuote(logs);
  }

  static async updateQuoteLifecycle(
    input: PricingQuoteLifecycleUpdateInput
  ): Promise<PricingQuoteView> {
    const current = await this.getQuoteRequest(input.companyId, input.requestId);
    const nextStatus = input.status ?? current.status;

    if (input.status && input.status !== current.status) {
      const allowedTransitions = QUOTE_STATUS_TRANSITIONS[current.status] ?? [];
      if (!allowedTransitions.includes(input.status)) {
        throw new BadRequestError(
          `Invalid pricing quote transition from ${current.status} to ${input.status}`
        );
      }
    }

    const lifecyclePatch = {
      status: nextStatus,
      ownerId: input.ownerId ?? current.ownerId,
      followUpAt: input.followUpAt === undefined ? current.followUpAt : input.followUpAt,
      notes: input.notes ?? current.notes,
      reason: input.reason,
    };

    await AuditLogService.log({
      companyId: input.companyId,
      actorId: input.actorId,
      action: PRICING_QUOTE_UPDATED_ACTION,
      targetType: PRICING_QUOTE_TARGET,
      targetId: input.requestId,
      changes: {
        previousStatus: current.status,
        lifecycle: lifecyclePatch,
      },
    });

    try {
      await WebhooksService.triggerWebhook(input.companyId, PRICING_QUOTE_UPDATED_ACTION, {
        requestId: input.requestId,
        previousStatus: current.status,
        status: nextStatus,
        ownerId: lifecyclePatch.ownerId,
        followUpAt: lifecyclePatch.followUpAt,
      });
    } catch (error) {
      logger.warn('Failed to dispatch pricing lifecycle webhook', {
        companyId: input.companyId,
        requestId: input.requestId,
        error,
      });
    }

    return this.getQuoteRequest(input.companyId, input.requestId);
  }

  static async exportQuoteRequests(
    companyId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<Record<string, any>> {
    const requests = await this.listQuoteRequests(companyId, 1000);
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'requestId',
        'createdAt',
        'status',
        'ownerId',
        'followUpAt',
        'tier',
        'aiTools',
        'frameworks',
        'advancedGovernance',
        'estimatedAnnualValue',
        'notes',
      ];
      
      const rows = requests.map((req) => [
        req.requestId,
        req.createdAt,
        req.status,
        req.ownerId || '',
        req.followUpAt || '',
        req.tier,
        req.aiTools,
        (req.frameworks ?? []).join(';'),
        req.advancedGovernance ? 'Yes' : 'No',
        req.estimatedAnnualValue ?? '',
        (req.notes ?? '').replace(/"/g, '""'),
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
        ),
      ].join('\n');
      
      return {
        format: 'csv',
        filename: `pricing-quotes-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
      };
    }
    
    // JSON format
    return {
      format: 'json',
      filename: `pricing-quotes-${new Date().toISOString().split('T')[0]}.json`,
      content: requests,
      count: requests.length,
    };
  }

  static async searchQuoteRequests(
    companyId: string,
    filters?: {
      status?: PricingQuoteStatus;
      tier?: PricingInput['tier'];
      minValue?: number;
      maxValue?: number;
      ownerId?: string;
      createdAfter?: string;
      createdBefore?: string;
    }
  ): Promise<PricingQuoteView[]> {
    const allRequests = await this.listQuoteRequests(companyId, 1000);
    
    if (!filters) return allRequests;
    
    return allRequests.filter((req) => {
      if (filters.status && req.status !== filters.status) return false;
      if (filters.tier && req.tier !== filters.tier) return false;
      if (filters.ownerId && req.ownerId !== filters.ownerId) return false;
      if (filters.minValue && (req.estimatedAnnualValue ?? 0) < filters.minValue) return false;
      if (filters.maxValue && (req.estimatedAnnualValue ?? 0) > filters.maxValue) return false;
      if (filters.createdAfter && new Date(req.createdAt) < new Date(filters.createdAfter)) return false;
      if (filters.createdBefore && new Date(req.createdAt) > new Date(filters.createdBefore)) return false;
      return true;
    });
  }

  private static materializeQuote(
    logs: Awaited<ReturnType<typeof AuditLogService.listByTarget>>
  ): PricingQuoteView {
    const orderedLogs = [...logs].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    );
    const requestLog = orderedLogs.find((log) => log.action === PRICING_QUOTE_ACTION);

    if (!requestLog || !requestLog.targetId) {
      throw new NotFoundError('Pricing quote request not found');
    }

    const requestChanges = (requestLog.changes ?? {}) as Record<string, any>;
    const requestInput = (requestChanges.input ?? {}) as Record<string, any>;
    const quote = requestChanges.quote ?? computePricing({
      tier: requestInput.tier ?? 'mid-market',
      aiTools: Number(requestInput.aiTools ?? 0),
      frameworks: Array.isArray(requestInput.frameworks) ? requestInput.frameworks : [],
      advancedGovernance: Boolean(requestInput.advancedGovernance),
    });

    const lifecycle = orderedLogs
      .filter((log) => log.action === PRICING_QUOTE_UPDATED_ACTION)
      .reduce(
        (state, log) => {
          const lifecycleChanges = ((log.changes ?? {}) as Record<string, any>).lifecycle ?? {};
          return {
            status: lifecycleChanges.status ?? state.status,
            ownerId: lifecycleChanges.ownerId ?? state.ownerId,
            followUpAt:
              lifecycleChanges.followUpAt !== undefined
                ? lifecycleChanges.followUpAt
                : state.followUpAt,
            notes: lifecycleChanges.notes ?? state.notes,
            updatedAt: log.createdAt.toISOString(),
          };
        },
        {
          status: 'REQUESTED' as PricingQuoteStatus,
          ownerId: undefined as string | undefined,
          followUpAt: requestInput.targetGoLive ?? null,
          notes: requestInput.notes,
          updatedAt: requestLog.createdAt.toISOString(),
        }
      );

    return {
      requestId: requestLog.targetId,
      companyId: requestLog.companyId,
      actorId: requestLog.actorId ?? undefined,
      createdAt: requestLog.createdAt.toISOString(),
      updatedAt: lifecycle.updatedAt,
      status: lifecycle.status,
      ownerId: lifecycle.ownerId,
      followUpAt: lifecycle.followUpAt,
      notes: lifecycle.notes,
      tier: requestInput.tier ?? 'mid-market',
      aiTools: Number(requestInput.aiTools ?? 0),
      frameworks: Array.isArray(requestInput.frameworks) ? requestInput.frameworks : [],
      advancedGovernance: Boolean(requestInput.advancedGovernance),
      stakeholderCount:
        requestInput.stakeholderCount !== undefined
          ? Number(requestInput.stakeholderCount)
          : undefined,
      targetGoLive: requestInput.targetGoLive,
      estimatedAnnualValue:
        typeof requestChanges.estimatedAnnualValue === 'number'
          ? requestChanges.estimatedAnnualValue
          : null,
      quote,
      history: orderedLogs.map((log) => ({
        action: log.action,
        actorId: log.actorId ?? undefined,
        createdAt: log.createdAt.toISOString(),
        changes: (log.changes ?? undefined) as Record<string, unknown> | undefined,
      })),
    } satisfies PricingQuoteView;
  }
}