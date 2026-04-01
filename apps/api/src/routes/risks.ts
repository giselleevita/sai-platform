import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { RiskController } from '../controllers';
import { validate } from '../middleware/validation';
import {
  createRiskSchema,
  updateRiskSchema,
  riskDecisionSchema,
  riskClassificationSchema,
  paginationSchema,
  searchSchema,
} from '../validation/schemas';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(Permission.RISK_READ),
  validate({ query: paginationSchema.merge(searchSchema) }),
  asyncHandler(RiskController.list)
);
router.post(
  '/',
  requirePermission(Permission.RISK_WRITE),
  validate({ body: createRiskSchema }),
  asyncHandler(RiskController.create)
);
router.patch(
  '/:id',
  requirePermission(Permission.RISK_WRITE),
  validate({ body: updateRiskSchema }),
  asyncHandler(RiskController.update)
);
router.delete(
  '/:id',
  requirePermission(Permission.RISK_DELETE),
  asyncHandler(RiskController.delete)
);
router.post(
  '/:id/decisions',
  requirePermission(Permission.RISK_DECISION),
  validate({ body: riskDecisionSchema }),
  asyncHandler(RiskController.addDecision)
);
router.post(
  '/classify',
  requirePermission(Permission.RISK_READ),
  validate({ body: riskClassificationSchema }),
  asyncHandler(RiskController.classify)
);

export default router;
