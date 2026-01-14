import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { VendorController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.VENDOR_READ), asyncHandler(VendorController.list));
router.post(
  '/',
  requirePermission(Permission.VENDOR_WRITE),
  asyncHandler(VendorController.create)
);
router.patch(
  '/:id',
  requirePermission(Permission.VENDOR_WRITE),
  asyncHandler(VendorController.update)
);
router.delete(
  '/:id',
  requirePermission(Permission.VENDOR_DELETE),
  asyncHandler(VendorController.delete)
);

export default router;
