import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { PricingService } from '../services/pricing.service';

const router = Router();

router.use(authMiddleware);

const pricingQuoteSchema = z.object({
  tier: z.enum(['mid-market', 'enterprise']).default('mid-market'),
  aiTools: z.number().int().min(0).max(10000),
  frameworks: z.array(z.string().trim().min(1)).default([]),
  advancedGovernance: z.boolean().default(false),
  stakeholderCount: z.number().int().min(1).max(10000).optional(),
  targetGoLive: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
});

const pricingQuoteLifecycleSchema = z
  .object({
    status: z
      .enum([
        'REQUESTED',
        'QUALIFIED',
        'DISCOVERY',
        'PILOT_PROPOSED',
        'PILOT_ACTIVE',
        'CLOSED_WON',
        'CLOSED_LOST',
      ])
      .optional(),
    ownerId: z.string().trim().min(1).optional(),
    followUpAt: z.string().datetime().nullable().optional(),
    notes: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(1000).optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.ownerId !== undefined ||
      value.followUpAt !== undefined ||
      value.notes !== undefined ||
      value.reason !== undefined,
    'At least one lifecycle field must be provided'
  );

/**
 * POST /api/pricing/quote
 * Body: { tier: 'mid-market' | 'enterprise', aiTools: number, frameworks: string[], advancedGovernance: boolean }
 */
router.post(
  '/quote',
  requirePermission(Permission.COMPLIANCE_READ),
  validate({ body: pricingQuoteSchema }),
  async (req, res) => {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;

    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const input = req.body;
    const result = await PricingService.createQuoteRequest({
      companyId,
      actorId,
      tier: input.tier,
      aiTools: input.aiTools,
      frameworks: input.frameworks,
      advancedGovernance: input.advancedGovernance,
      stakeholderCount: input.stakeholderCount,
      targetGoLive: input.targetGoLive,
      notes: input.notes,
    });

    res.json({ success: true, data: result });
  }
);

router.get('/requests', requirePermission(Permission.COMPLIANCE_READ), async (req, res) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const requests = await PricingService.listQuoteRequests(companyId);
  res.json({ success: true, data: requests });
});

router.get('/requests/:id', requirePermission(Permission.COMPLIANCE_READ), async (req, res) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const request = await PricingService.getQuoteRequest(companyId, req.params.id);
  res.json({ success: true, data: request });
});

router.patch(
  '/requests/:id',
  requirePermission(Permission.COMPLIANCE_WRITE),
  validate({ body: pricingQuoteLifecycleSchema }),
  async (req, res) => {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;

    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const updated = await PricingService.updateQuoteLifecycle({
      companyId,
      actorId,
      requestId: req.params.id,
      status: req.body.status,
      ownerId: req.body.ownerId,
      followUpAt: req.body.followUpAt,
      notes: req.body.notes,
      reason: req.body.reason,
    });

    res.json({ success: true, data: updated });
  }
);

router.get(
  '/requests/export',
  requirePermission(Permission.COMPLIANCE_EXPORT),
  async (req, res) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const format = (req.query.format as string) || 'json';
    const result = await PricingService.exportQuoteRequests(companyId, format as 'json' | 'csv');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.content);
    } else {
      res.json({ success: true, data: result });
    }
  }
);

router.get(
  '/requests/search',
  requirePermission(Permission.COMPLIANCE_READ),
  async (req, res) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const filters = {
      status: req.query.status as any,
      tier: req.query.tier as any,
      minValue: req.query.minValue ? Number(req.query.minValue) : undefined,
      maxValue: req.query.maxValue ? Number(req.query.maxValue) : undefined,
      ownerId: req.query.ownerId as string | undefined,
      createdAfter: req.query.createdAfter as string | undefined,
      createdBefore: req.query.createdBefore as string | undefined,
    };

    const results = await PricingService.searchQuoteRequests(companyId, filters);
    res.json({ success: true, data: results, count: results.length });
  }
);

export default router;
