import { Router } from 'express';
import { authMiddleware, Permission, requirePermission } from '../middleware';
import { asyncHandler } from '../utils';
import { validate } from '../middleware/validation';
import { conformityAssessmentSchema } from '../validation/schemas';
import { ConformityController } from '../controllers/conformity.controller';

const router = Router();

router.use(authMiddleware);

router.post(
  '/assess',
  requirePermission(Permission.COMPLIANCE_READ),
  validate({ body: conformityAssessmentSchema }),
  asyncHandler(ConformityController.assess)
);

export default router;