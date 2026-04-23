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
    const webhooks = await prisma.webhook.findMany({
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
        webhooks.map(async (webhook) => {
        try {
          const url = new URL(webhook.url);
          const timeoutMs = Number(process.env.WEBHOOK_TIMEOUT_MS || '5000');
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          const response = await fetch(webhook.url, {
            method: 'POST',
            redirect: 'error',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': this.generateSignature(
                JSON.stringify(payload),
                webhook.secret
              ),
            },
            body: JSON.stringify(payload),
          });
          clearTimeout(timer);

          if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status}`);
          }

          logger.info(`Webhook triggered`, { webhookId: webhook.id, host: url.host, event });
        } catch (error) {
          logger.error(`Webhook failed`, error, { webhookId: webhook.id, event });
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
    return await prisma.webhook.create({
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
    return await prisma.webhook.findMany({
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
    await prisma.webhook.delete({
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
