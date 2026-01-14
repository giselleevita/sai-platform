import { Router } from 'express';
import { computePricing } from '../config/pricing';
import { authMiddleware, requirePermission, Permission } from '../middleware';

const router = Router();

router.use(authMiddleware);

/**
 * POST /api/pricing/quote
 * Body: { tier: 'mid-market' | 'enterprise', aiTools: number, frameworks: string[], advancedGovernance: boolean }
 */
router.post('/quote', requirePermission(Permission.COMPLIANCE_READ), (req, res) => {
  const input = req.body;
  const quote = computePricing({
    tier: input.tier || 'mid-market',
    aiTools: Number(input.aiTools || 0),
    frameworks: Array.isArray(input.frameworks) ? input.frameworks : [],
    advancedGovernance: Boolean(input.advancedGovernance),
  });
  res.json({ success: true, data: quote });
});

export default router;
