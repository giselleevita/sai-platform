import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { InvitationsController } from '../controllers/invitations.controller';
import { validate } from '../middleware/validation';
import { createInvitationSchema } from '../validation/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.INVITE_READ), asyncHandler(InvitationsController.list));
router.post(
  '/',
  requirePermission(Permission.INVITE_CREATE),
  validate({ body: createInvitationSchema }),
  asyncHandler(InvitationsController.create),
);
router.patch(
  '/:id/revoke',
  requirePermission(Permission.INVITE_REVOKE),
  asyncHandler(InvitationsController.revoke),
);

export default router;

