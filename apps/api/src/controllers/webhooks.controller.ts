import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { WebhooksService } from '../services/webhooks.service';
import { BadRequestError } from '../errors/AppError';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters'),
});

export class WebhooksController {
  /**
   * GET /api/webhooks
   * List webhooks for company
   */
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const webhooks = await WebhooksService.listWebhooks(companyId);
    res.json({ success: true, data: webhooks });
  }

  /**
   * POST /api/webhooks
   * Create webhook
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      throw new BadRequestError('URL and events are required');
    }

    if (!secret || secret.length < 16) {
      throw new BadRequestError('Secret must be at least 16 characters');
    }

    const webhook = await WebhooksService.createWebhook(companyId, url, events, secret);
    res.status(201).json({ success: true, data: webhook });
  }

  /**
   * DELETE /api/webhooks/:id
   * Delete webhook
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    await WebhooksService.deleteWebhook(companyId, id);
    res.json({ success: true, message: 'Webhook deleted' });
  }
}
