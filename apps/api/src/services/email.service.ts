import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/** How outbound mail is handled. See EMAIL_PROVIDER in env.example */
export type EmailDeliveryMode = 'console' | 'log' | 'none' | 'smtp' | 'sendgrid' | 'ses';

let warnedProductionNoProvider = false;

function smtpEnvComplete(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim(),
  );
}

function sendgridEnvComplete(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY?.trim() && process.env.SENDGRID_FROM?.trim());
}

function sesEnvComplete(): boolean {
  return Boolean(process.env.SES_FROM?.trim() && process.env.AWS_REGION?.trim());
}

/**
 * Resolve delivery mode from EMAIL_PROVIDER.
 * - unset: `console` in development, `none` in production (no mail sent)
 * - `console` | `log` | `none`: explicit
 * - `smtp`: used when SMTP_HOST, SMTP_USER, SMTP_PASS are set; otherwise `none` + warning
 * - `sendgrid`: used when SENDGRID_API_KEY and SENDGRID_FROM are set
 * - `ses`: used when SES_FROM and AWS_REGION are set (credentials via default AWS provider chain)
 */
export function resolveEmailDeliveryMode(): EmailDeliveryMode {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!raw) {
    return nodeEnv === 'development' ? 'console' : 'none';
  }

  if (raw === 'console' || raw === 'log' || raw === 'none') {
    return raw;
  }

  if (raw === 'smtp') {
    if (smtpEnvComplete()) {
      return 'smtp';
    }
    logger.warn(
      '[email] EMAIL_PROVIDER=smtp but SMTP_HOST, SMTP_USER, and SMTP_PASS must all be set; no mail sent',
    );
    return 'none';
  }

  if (raw === 'sendgrid') {
    if (sendgridEnvComplete()) {
      return 'sendgrid';
    }
    logger.warn(
      '[email] EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY and SENDGRID_FROM must be set; no mail sent',
    );
    return 'none';
  }

  if (raw === 'ses') {
    if (sesEnvComplete()) {
      return 'ses';
    }
    logger.warn(
      '[email] EMAIL_PROVIDER=ses but SES_FROM and AWS_REGION must be set; no mail sent',
    );
    return 'none';
  }

  logger.warn(`[email] Unknown EMAIL_PROVIDER="${raw}"; treating as none`);
  return 'none';
}

async function sendViaSmtp(options: EmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from = process.env.SMTP_FROM?.trim() || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info('Email sent via SMTP', { to: options.to, subject: options.subject });
  } catch (err) {
    logger.error('SMTP send failed', err);
  }
}

async function sendViaSendgrid(options: EmailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY!.trim();
  const from = process.env.SENDGRID_FROM!.trim();
  sgMail.setApiKey(apiKey);
  const to = Array.isArray(options.to) ? options.to : [options.to];
  try {
    await sgMail.send({
      to,
      from,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info('Email sent via SendGrid', { to: options.to, subject: options.subject });
  } catch (err) {
    logger.error('SendGrid send failed', err);
  }
}

async function sendViaSes(options: EmailOptions): Promise<void> {
  const region = process.env.AWS_REGION!.trim();
  const from = process.env.SES_FROM!.trim();
  const client = new SESv2Client({ region });
  const to = Array.isArray(options.to) ? options.to : [options.to];
  const textBody = options.text ?? options.html.replace(/<[^>]+>/g, ' ').trim();
  try {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: to },
        Content: {
          Simple: {
            Subject: { Data: options.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: options.html, Charset: 'UTF-8' },
              Text: { Data: textBody, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
    logger.info('Email sent via Amazon SES', { to: options.to, subject: options.subject });
  } catch (err) {
    logger.error('SES send failed', err);
  }
}

export class EmailService {
  /**
   * Send email notification.
   * Configure EMAIL_PROVIDER (see env.example). Production defaults to no mail until you wire SES/SendGrid/etc.
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    const mode = resolveEmailDeliveryMode();

    if (mode === 'none') {
      if (process.env.NODE_ENV === 'production' && !warnedProductionNoProvider) {
        logger.warn(
          '[email] EMAIL_PROVIDER is none or unset in production; no emails are sent. Set EMAIL_PROVIDER=console for demos or integrate a provider.',
        );
        warnedProductionNoProvider = true;
      }
      logger.debug('Email skipped (delivery mode none)', {
        to: options.to,
        subject: options.subject,
      });
      return;
    }

    if (mode === 'log') {
      logger.info('Email notification (log mode — not sent)', {
        to: options.to,
        subject: options.subject,
        preview: (options.text || options.html).slice(0, 200),
      });
      return;
    }

    if (mode === 'smtp') {
      await sendViaSmtp(options);
      return;
    }

    if (mode === 'sendgrid') {
      await sendViaSendgrid(options);
      return;
    }

    if (mode === 'ses') {
      await sendViaSes(options);
      return;
    }

    // console — human-visible in dev / intentional demos
    console.log('\n📧 Email Notification (console mode — not sent via provider):');
    console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text || options.html.substring(0, 100)}...\n`);
  }

  /**
   * Send high-risk tool notification
   */
  static async sendHighRiskToolNotification(
    userEmail: string,
    toolName: string,
    riskLevel: string,
    riskScore: number
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `⚠️ High Risk Alert: ${toolName}`,
      html: `
        <h2>High Risk AI Tool Detected</h2>
        <p>The AI tool <strong>${toolName}</strong> has been flagged as <strong>${riskLevel}</strong> risk.</p>
        <p><strong>Risk Score:</strong> ${riskScore}/100</p>
        <p>Please review and take appropriate action.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/inventory">View in Dashboard</a></p>
      `,
      text: `High Risk Alert: ${toolName} has been flagged as ${riskLevel} risk (Score: ${riskScore}/100). Please review.`,
    });
  }

  /**
   * Send compliance deadline notification
   */
  static async sendComplianceDeadlineNotification(
    userEmail: string,
    deadline: string,
    items: Array<{ type: string; name: string }>
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `📅 Compliance Deadline Approaching: ${deadline}`,
      html: `
        <h2>Compliance Deadline Reminder</h2>
        <p>The following items have upcoming compliance deadlines:</p>
        <ul>
          ${items.map((item) => `<li><strong>${item.type}:</strong> ${item.name}</li>`).join('')}
        </ul>
        <p><strong>Deadline:</strong> ${deadline}</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/compliance">View Compliance Dashboard</a></p>
      `,
      text: `Compliance Deadline: ${deadline}. Items: ${items.map((i) => `${i.type}: ${i.name}`).join(', ')}`,
    });
  }

  /**
   * Send incident notification
   */
  static async sendIncidentNotification(
    userEmail: string,
    incidentTitle: string,
    severity: string,
    status: string
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `🚨 Incident ${status}: ${incidentTitle}`,
      html: `
        <h2>Security Incident Update</h2>
        <p><strong>Title:</strong> ${incidentTitle}</p>
        <p><strong>Severity:</strong> ${severity}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents">View Incident</a></p>
      `,
      text: `Incident ${status}: ${incidentTitle} (Severity: ${severity})`,
    });
  }

  /**
   * Send scheduled report notification
   */
  static async sendScheduledReportNotification(
    userEmail: string,
    reportName: string,
    reportUrl: string
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `📊 Scheduled Report: ${reportName}`,
      html: `
        <h2>Your Scheduled Report is Ready</h2>
        <p>The report <strong>${reportName}</strong> has been generated.</p>
        <p><a href="${reportUrl}">Download Report</a></p>
      `,
      text: `Scheduled Report Ready: ${reportName}. Download at: ${reportUrl}`,
    });
  }
}
