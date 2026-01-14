import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { EvidenceController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.EVIDENCE_READ), asyncHandler(EvidenceController.list));
router.post(
  '/',
  requirePermission(Permission.EVIDENCE_WRITE),
  asyncHandler(EvidenceController.create)
);
router.patch(
  '/:id',
  requirePermission(Permission.EVIDENCE_WRITE),
  asyncHandler(EvidenceController.update)
);
router.delete(
  '/:id',
  requirePermission(Permission.EVIDENCE_DELETE),
  asyncHandler(EvidenceController.delete)
);

export default router;
