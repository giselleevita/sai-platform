import * as cron from 'node-cron';
import { prisma } from './prisma.client';
import { PDFReportService, ReportOptions } from './pdf-report.service';
import { AuditLogService } from './audit-log.service';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

export interface ScheduledReport {
  id: string;
  companyId: string;
  name: string;
  type: 'risk-assessment' | 'compliance' | 'executive-summary' | 'custom';
  schedule: string; // Cron expression
  options: ReportOptions;
  recipients: string[]; // Email addresses
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

const SCHEDULED_REPORT_TARGET = 'ScheduledReport';
const SCHEDULED_REPORT_ACTIONS = {
  CREATED: 'scheduled-report.created',
  EXECUTED: 'scheduled-report.executed',
  DELETED: 'scheduled-report.deleted',
  UPDATED: 'scheduled-report.updated',
};

export class ScheduledReportsService {
  private static tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize scheduled reports for a company on boot
   */
  static async initializeCompanyReports(companyId: string) {
    try {
      const reports = await this.getScheduledReports(companyId);
      for (const report of reports) {
        if (report.enabled) {
          this.scheduleReport(report.id, companyId, report);
        }
      }
      logger.info(`Initialized ${reports.length} scheduled reports for company ${companyId}`);
    } catch (error) {
      logger.error(`Failed to initialize scheduled reports for company ${companyId}:`, error);
    }
  }

  /**
   * Re-initialize all scheduled reports from all companies
   */
  static async initializeAllCompanyReports() {
    try {
      const companies = await prisma.company.findMany({
        select: { id: true },
      });
      for (const company of companies) {
        await this.initializeCompanyReports(company.id);
      }
      logger.info(`Initialized scheduled reports for ${companies.length} companies`);
    } catch (error) {
      logger.error('Failed to initialize scheduled reports across companies:', error);
    }
  }

  /**
   * Create a scheduled report
   */
  static async createScheduledReport(
    companyId: string,
    actorId: string | undefined,
    report: Omit<ScheduledReport, 'id' | 'lastRun' | 'nextRun'>
  ): Promise<ScheduledReport> {
    const id = randomUUID();
    
    // Persist to audit log
    await AuditLogService.log({
      companyId,
      actorId,
      action: SCHEDULED_REPORT_ACTIONS.CREATED,
      targetType: SCHEDULED_REPORT_TARGET,
      targetId: id,
      changes: {
        ...report,
        nextRun: this.calculateNextRun(report.schedule),
      },
    });

    if (report.enabled) {
      this.scheduleReport(id, companyId, report);
    }

    const scheduledReport: ScheduledReport = {
      id,
      ...report,
      lastRun: undefined,
      nextRun: this.calculateNextRun(report.schedule),
    };

    return scheduledReport;
  }

  /**
   * Schedule a report
   */
  private static scheduleReport(
    id: string,
    companyId: string,
    report: Omit<ScheduledReport, 'id' | 'companyId' | 'lastRun' | 'nextRun'>
  ) {
    // Remove existing task if any
    this.removeSchedule(id);

    // Validate cron expression
    if (!cron.validate(report.schedule)) {
      throw new Error(`Invalid cron expression: ${report.schedule}`);
    }

    const task = cron.schedule(report.schedule, async () => {
      try {
        logger.info(`Running scheduled report ${id} for company ${companyId}`);
        
        const pdf = await PDFReportService.generatePDF(companyId, report.options);
        const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports/${id}/download`;
        
        // Send email to recipients
        for (const recipient of report.recipients) {
          try {
            await EmailService.sendScheduledReportNotification(recipient, report.name, reportUrl);
          } catch (emailError) {
            logger.warn(`Failed to send scheduled report email to ${recipient}:`, emailError);
          }
        }
        
        // Log execution
        await AuditLogService.log({
          companyId,
          action: SCHEDULED_REPORT_ACTIONS.EXECUTED,
          targetType: SCHEDULED_REPORT_TARGET,
          targetId: id,
          changes: {
            executedAt: new Date().toISOString(),
            recipientCount: report.recipients.length,
            status: 'success',
          },
        });
        
        logger.info(`Scheduled report ${id} generated and sent successfully`);
        
      } catch (error) {
        logger.error(`Error running scheduled report ${id}:`, error);
        
        await AuditLogService.log({
          companyId,
          action: SCHEDULED_REPORT_ACTIONS.EXECUTED,
          targetType: SCHEDULED_REPORT_TARGET,
          targetId: id,
          changes: {
            executedAt: new Date().toISOString(),
            status: 'failed',
            error: String(error),
          },
        });
      }
    });

    this.tasks.set(id, task);
    logger.info(`Scheduled report ${id} with schedule: ${report.schedule}`);
  }

  /**
   * Remove a scheduled report
   */
  static removeSchedule(id: string) {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
      logger.info(`Removed scheduled report ${id}`);
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  private static calculateNextRun(cronExpression: string): Date {
    // Simple implementation - in production, use a proper cron parser
    const now = new Date();
    const nextRun = new Date(now);
    
    // Basic parsing for common schedules
    if (cronExpression === '0 9 * * 1') {
      // Every Monday at 9 AM
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      nextRun.setDate(now.getDate() + daysUntilMonday);
      nextRun.setHours(9, 0, 0, 0);
    } else if (cronExpression === '0 9 1 * *') {
      // First day of month at 9 AM
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(1);
      nextRun.setHours(9, 0, 0, 0);
    } else if (cronExpression === '0 9 * * *') {
      // Daily at 9 AM
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0);
    }
    
    return nextRun;
  }

  /**
   * Get all scheduled reports for a company
   */
  static async getScheduledReports(companyId: string): Promise<ScheduledReport[]> {
    const logs = await AuditLogService.listByAction(
      companyId,
      SCHEDULED_REPORT_ACTIONS.CREATED,
      SCHEDULED_REPORT_TARGET,
      100
    );
    
    const reportIds = logs
      .map((log) => log.targetId)
      .filter((targetId): targetId is string => Boolean(targetId));
    
    const allLogs = await AuditLogService.listByTargetIds(
      companyId,
      SCHEDULED_REPORT_TARGET,
      reportIds
    );
    
    const grouped = new Map<string, typeof allLogs>();
    for (const log of allLogs) {
      if (!log.targetId) continue;
      const existing = grouped.get(log.targetId) ?? [];
      existing.push(log);
      grouped.set(log.targetId, existing);
    }
    
    return reportIds
      .map((reportId) => grouped.get(reportId))
      .filter((logs): logs is NonNullable<typeof logs> => Boolean(logs))
      .map((logs) => this.materializeReport(logs));
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    id: string,
    companyId: string,
    actorId: string | undefined,
    updates: Partial<Omit<ScheduledReport, 'id' | 'companyId'>>
  ): Promise<ScheduledReport> {
    // Get current state
    const current = await this.getScheduledReportById(companyId, id);
    
    // Log update
    await AuditLogService.log({
      companyId,
      actorId,
      action: SCHEDULED_REPORT_ACTIONS.UPDATED,
      targetType: SCHEDULED_REPORT_TARGET,
      targetId: id,
      changes: {
        previousState: current,
        updates,
      },
    });
    
    // Reschedule if needed
    const updated = { ...current, ...updates };
    if (updates.enabled !== undefined || updates.schedule !== undefined) {
      this.removeSchedule(id);
      if (updated.enabled) {
        this.scheduleReport(id, companyId, updated);
      }
    }
    
    return updated;
  }

  /**
   * Get a single scheduled report by ID
   */
  static async getScheduledReportById(companyId: string, id: string): Promise<ScheduledReport> {
    const logs = await AuditLogService.listByTarget(
      companyId,
      SCHEDULED_REPORT_TARGET,
      id
    );
    
    if (logs.length === 0) {
      throw new Error(`Scheduled report ${id} not found`);
    }
    
    return this.materializeReport(logs);
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(id: string, companyId: string, actorId: string | undefined): Promise<void> {
    this.removeSchedule(id);
    
    await AuditLogService.log({
      companyId,
      actorId,
      action: SCHEDULED_REPORT_ACTIONS.DELETED,
      targetType: SCHEDULED_REPORT_TARGET,
      targetId: id,
      changes: {
        deletedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Materialize a scheduled report from audit logs
   */
  private static materializeReport(logs: Awaited<ReturnType<typeof AuditLogService.listByTarget>>): ScheduledReport {
    const createdLog = logs.find((l) => l.action === SCHEDULED_REPORT_ACTIONS.CREATED);
    
    if (!createdLog || !createdLog.targetId) {
      throw new Error('Scheduled report creation log not found');
    }
    
    const createdData = (createdLog.changes as Record<string, any>) ?? {};
    const lastExecutionLog = [...logs]
      .reverse()
      .find((l) => l.action === SCHEDULED_REPORT_ACTIONS.EXECUTED);
    
    return {
      id: createdLog.targetId,
      companyId: createdLog.companyId,
      name: createdData.name,
      type: createdData.type,
      schedule: createdData.schedule,
      options: createdData.options,
      recipients: createdData.recipients ?? [],
      enabled: createdData.enabled ?? true,
      lastRun: lastExecutionLog?.createdAt,
      nextRun: createdData.nextRun,
    };
  }
}
