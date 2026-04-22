import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityFeedService } from '../services/activity-feed.service';
import { BadRequestError } from '../errors/AppError';

export class ActivityController {
  /**
   * GET /api/activity
   * Get activity feed
   */
  static async getFeed(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const type = req.query.type as string | undefined;
    const since = req.query.since
      ? new Date(req.query.since as string)
      : undefined;

    const activities = await ActivityFeedService.getActivityFeed(companyId, {
      limit,
      type: type as any,
      since,
    });

    res.json({ success: true, data: activities });
  }

  /**
   * GET /api/activity/:type/:id
   * Get activity for specific item
   */
  static async getItemActivity(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { type, id } = req.params;

    if (!['tool', 'risk', 'incident', 'policy', 'control', 'evidence'].includes(type)) {
      throw new BadRequestError('Invalid type. Must be tool, risk, incident, policy, control, or evidence');
    }

    const activities = await ActivityFeedService.getItemActivity(
      companyId,
      type,
      id
    );

    res.json({ success: true, data: activities });
  }
}
