import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { ExceptionController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.EXCEPTION_READ), asyncHandler(ExceptionController.list));
router.post(
  '/',
  requirePermission(Permission.EXCEPTION_WRITE),
  asyncHandler(ExceptionController.create)
);
router.patch(
  '/:id',
  requirePermission(Permission.EXCEPTION_APPROVE),
  asyncHandler(ExceptionController.update)
);

export default router;
