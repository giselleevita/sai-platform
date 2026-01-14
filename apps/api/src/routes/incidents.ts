import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { IncidentController } from '../controllers';
import { validate } from '../middleware/validation';
import { createIncidentSchema, updateIncidentSchema, paginationSchema, searchSchema } from '../validation/schemas';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(Permission.INCIDENT_READ),
  validate({ query: paginationSchema.merge(searchSchema) }),
  asyncHandler(IncidentController.list)
);
router.post(
  '/',
  requirePermission(Permission.INCIDENT_WRITE),
  validate({ body: createIncidentSchema }),
  asyncHandler(IncidentController.create)
);
router.patch(
  '/:id',
  requirePermission(Permission.INCIDENT_WRITE),
  validate({ body: updateIncidentSchema }),
  asyncHandler(IncidentController.update)
);
router.delete(
  '/:id',
  requirePermission(Permission.INCIDENT_DELETE),
  asyncHandler(IncidentController.delete)
);

export default router;
