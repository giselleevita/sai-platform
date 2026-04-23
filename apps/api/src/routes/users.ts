import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { UsersController } from '../controllers/users.controller';
import { validate } from '../middleware/validation';
import { updateUserSchema } from '../validation/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.USER_READ), asyncHandler(UsersController.list));
router.patch(
  '/:id',
  requirePermission(Permission.USER_WRITE),
  validate({ body: updateUserSchema }),
  asyncHandler(UsersController.update),
);

export default router;

