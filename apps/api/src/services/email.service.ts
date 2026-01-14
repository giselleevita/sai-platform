import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send email notification
   * In production, integrate with SendGrid, AWS SES, or similar
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    logger.info('Email notification (not sent in dev):', {
      to: options.to,
      subject: options.subject,
    });

    // In development, just log
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 Email Notification:');
      console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text || options.html.substring(0, 100)}...\n`);
      return;
    }

    // In production, send actual email
    // await sendGrid.send(options);
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
