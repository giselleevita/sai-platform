import { prisma } from './prisma.client';
import { logger } from '../utils/logger';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  companyId: string;
}

export class WebhooksService {
  /**
   * Trigger webhook for event
   */
  static async triggerWebhook(
    companyId: string,
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    // Get active webhooks for company
    const webhooks = await (prisma as any).webhook.findMany({
      where: {
        companyId,
        active: true,
        events: {
          has: event, // Check if webhook subscribes to this event
        },
      },
    });

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      companyId,
    };

      // Send to all matching webhooks
      await Promise.allSettled(
        webhooks.map(async (webhook: any) => {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': this.generateSignature(
                JSON.stringify(payload),
                webhook.secret
              ),
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status}`);
          }

          logger.info(`Webhook triggered: ${webhook.url} for event ${event}`);
        } catch (error) {
          logger.error(`Webhook failed for ${webhook.url}:`, error);
          // In production, you'd want to retry failed webhooks
        }
      })
    );
  }

  /**
   * Create webhook
   */
  static async createWebhook(
    companyId: string,
    url: string,
    events: string[],
    secret: string
  ) {
    return await (prisma as any).webhook.create({
      data: {
        companyId,
        url,
        events,
        secret,
        active: true,
      },
    });
  }

  /**
   * List webhooks for company
   */
  static async listWebhooks(companyId: string) {
    return await (prisma as any).webhook.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret
      },
    });
  }

  /**
   * Delete webhook
   */
  static async deleteWebhook(companyId: string, webhookId: string) {
    await (prisma as any).webhook.delete({
      where: { id: webhookId, companyId },
    });
  }

  /**
   * Generate webhook signature for verification
   */
  private static generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
