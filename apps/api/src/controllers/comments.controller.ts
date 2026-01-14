import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { CommentsService } from '../services/comments.service';
import { BadRequestError } from '../errors/AppError';

export class CommentsController {
  /**
   * GET /api/comments/:type/:id
   * Get comments for item
   */
  static async getComments(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { type, id } = req.params;

    if (!['tool', 'risk', 'incident'].includes(type)) {
      throw new BadRequestError('Invalid type. Must be tool, risk, or incident');
    }

    const comments = await CommentsService.getComments(
      companyId,
      type as any,
      id
    );

    res.json({ success: true, data: comments });
  }

  /**
   * POST /api/comments/:type/:id
   * Create comment
   */
  static async createComment(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId || !actorId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { type, id } = req.params;
    const { content, parentId } = req.body;

    if (!['tool', 'risk', 'incident'].includes(type)) {
      throw new BadRequestError('Invalid type. Must be tool, risk, or incident');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new BadRequestError('Comment content is required');
    }

    const comment = await CommentsService.createComment(
      companyId,
      actorId,
      type as any,
      id,
      { content: content.trim(), parentId }
    );

    res.status(201).json({ success: true, data: comment });
  }

  /**
   * DELETE /api/comments/:id
   * Delete comment
   */
  static async deleteComment(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId || !actorId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await CommentsService.deleteComment(companyId, actorId, id);

    res.json({ success: true, message: 'Comment deleted' });
  }
}
