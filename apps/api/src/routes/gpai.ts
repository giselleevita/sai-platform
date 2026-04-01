import { Router } from 'express';
import { authMiddleware, Permission, requirePermission } from '../middleware';
import { asyncHandler } from '../utils';
import { validate } from '../middleware/validation';
import { gpaiCreateSchema } from '../validation/schemas';
import { GpaiController } from '../controllers/gpai.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.COMPLIANCE_READ), asyncHandler(GpaiController.list));
router.post(
  '/',
  requirePermission(Permission.COMPLIANCE_READ),
  validate({ body: gpaiCreateSchema }),
  asyncHandler(GpaiController.create)
);

export default router;