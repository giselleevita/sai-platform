import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { EvidenceController } from '../controllers';
import { EvidenceAttachmentsController } from '../controllers/evidence-attachments.controller';
import { EvidenceReviewController } from '../controllers/evidence-review.controller';
import { validate } from '../middleware/validation';
import { createEvidenceSchema, updateEvidenceSchema } from '../validation/schemas';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', requirePermission(Permission.EVIDENCE_READ), asyncHandler(EvidenceController.list));
router.get('/review/queue', requirePermission(Permission.EVIDENCE_READ), asyncHandler(EvidenceReviewController.myQueue));
router.post(
  '/',
  requirePermission(Permission.EVIDENCE_WRITE),
  validate({ body: createEvidenceSchema }),
  asyncHandler(EvidenceController.create)
);
router.patch(
  '/:id',
  requirePermission(Permission.EVIDENCE_WRITE),
  validate({ body: updateEvidenceSchema }),
  asyncHandler(EvidenceController.update)
);
router.delete(
  '/:id',
  requirePermission(Permission.EVIDENCE_DELETE),
  asyncHandler(EvidenceController.delete)
);

router.get(
  '/:id/attachments',
  requirePermission(Permission.EVIDENCE_READ),
  asyncHandler(EvidenceAttachmentsController.list)
);
router.post(
  '/:id/attachments',
  requirePermission(Permission.EVIDENCE_WRITE),
  upload.single('file'),
  asyncHandler(EvidenceAttachmentsController.upload)
);
router.get(
  '/attachments/:attachmentId/download',
  requirePermission(Permission.EVIDENCE_READ),
  asyncHandler(EvidenceAttachmentsController.download)
);
router.delete(
  '/attachments/:attachmentId',
  requirePermission(Permission.EVIDENCE_WRITE),
  asyncHandler(EvidenceAttachmentsController.delete)
);

export default router;
