import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { validate } from '../middleware/validation';
import { createMLIntegrationSchema, updateMLIntegrationSchema } from '../validation/schemas';
import { asyncHandler } from '../utils';
import { MLIntegrationController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.TOOL_READ), asyncHandler(MLIntegrationController.list));

router.post(
  '/',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: createMLIntegrationSchema }),
  asyncHandler(MLIntegrationController.create)
);

router.patch(
  '/:id',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: updateMLIntegrationSchema }),
  asyncHandler(MLIntegrationController.update)
);

router.delete('/:id', requirePermission(Permission.TOOL_DELETE), asyncHandler(MLIntegrationController.remove));

export default router;
