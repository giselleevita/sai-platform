import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { CommentsController } from '../controllers/comments.controller';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000),
  parentId: z.string().optional(),
});

router.get(
  '/:type/:id',
  requirePermission(Permission.TOOL_READ), // Any read permission works
  asyncHandler(CommentsController.getComments)
);

router.post(
  '/:type/:id',
  requirePermission(Permission.TOOL_WRITE),
  validate({ body: createCommentSchema }),
  asyncHandler(CommentsController.createComment)
);

router.delete(
  '/:id',
  requirePermission(Permission.TOOL_WRITE),
  asyncHandler(CommentsController.deleteComment)
);

export default router;
