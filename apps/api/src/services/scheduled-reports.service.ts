import * as cron from 'node-cron';
import cronParser from 'cron-parser';
import { prisma } from './prisma.client';
import { PDFReportService, ReportOptions } from './pdf-report.service';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';
import type { Prisma } from '@prisma/client';
import { initRedis } from './cache.service';
import { randomUUID } from 'crypto';

interface ScheduledReport {
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

class ScheduledReportsService {
  private static tasks: Map<string, cron.ScheduledTask> = new Map();
  private static initialized = false;
  private static leader: { instanceId: string; renewTimer: NodeJS.Timeout } | null = null;

  private static async acquireLeaderLock(): Promise<boolean> {
    if (this.leader) return true;
    const client = initRedis();
    if (!client) return true; // dev mode / no Redis => best effort

    const instanceId = randomUUID();
    const lockKey = 'sai:scheduled_reports:leader';
    const ttlMs = 60_000;

    const ok = await client.set(lockKey, instanceId, 'PX', ttlMs, 'NX');
    if (ok !== 'OK') {
      logger.warn('Scheduled reports leader lock not acquired; skipping scheduler init');
      return false;
    }

    const renewTimer = setInterval(async () => {
      try {
        const current = await client.get(lockKey);
        if (current !== instanceId) {
          clearInterval(renewTimer);
          this.leader = null;
          return;
        }
        await client.set(lockKey, instanceId, 'PX', ttlMs, 'XX');
      } catch (e) {
        logger.warn('Scheduled reports leader lock renew failed', e);
      }
    }, Math.floor(ttlMs / 2));

    this.leader = { instanceId, renewTimer };
    return true;
  }

  /**
   * Initialize all enabled schedules at process boot.
   */
  static async initializeAllReports() {
    if (this.initialized) return;
    if (!(await this.acquireLeaderLock())) return;
    const rows = await prisma.scheduledReport.findMany({
      where: { enabled: true },
    });
    for (const row of rows) {
      this.scheduleReport(row.id, row.companyId, {
        name: row.name,
        type: row.type as ScheduledReport['type'],
        schedule: row.schedule,
        options: row.options as unknown as ReportOptions,
        recipients: row.recipients || [],
        enabled: row.enabled,
      });
    }
    this.initialized = true;
    logger.info(`Initialized ${rows.length} scheduled reports`);
  }

  /**
   * Initialize scheduled reports for one company.
   */
  static async initializeCompanyReports(companyId: string) {
    if (!(await this.acquireLeaderLock())) return;
    const rows = await prisma.scheduledReport.findMany({
      where: { companyId, enabled: true },
    });
    for (const row of rows) {
      this.scheduleReport(row.id, row.companyId, {
        name: row.name,
        type: row.type as ScheduledReport['type'],
        schedule: row.schedule,
        options: row.options as unknown as ReportOptions,
        recipients: row.recipients || [],
        enabled: row.enabled,
      });
    }
    logger.info(`Initialized scheduled reports for company ${companyId}`);
  }

  /**
   * Create a scheduled report.
   */
  static async createScheduledReport(
    companyId: string,
    report: Omit<ScheduledReport, 'id' | 'companyId' | 'lastRun' | 'nextRun'>
  ): Promise<ScheduledReport> {
    if (!cron.validate(report.schedule)) {
      throw new Error(`Invalid cron expression: ${report.schedule}`);
    }
    const nextRun = this.calculateNextRun(report.schedule);
    const created = await prisma.scheduledReport.create({
      data: {
        companyId,
        name: report.name,
        type: report.type,
        schedule: report.schedule,
        options: report.options as unknown as Prisma.InputJsonValue,
        recipients: report.recipients || [],
        enabled: report.enabled ?? true,
        nextRun,
      },
    });

    if (created.enabled) {
      this.scheduleReport(created.id, companyId, {
        name: created.name,
        type: created.type as ScheduledReport['type'],
        schedule: created.schedule,
        options: created.options as unknown as ReportOptions,
        recipients: created.recipients || [],
        enabled: created.enabled,
      });
    }

    return this.toScheduledReport(created);
  }

  /**
   * Schedule a report.
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

        await PDFReportService.generatePDF(companyId, report.options);
        const now = new Date();
        const nextRun = this.calculateNextRun(report.schedule, now);

        await prisma.scheduledReport.updateMany({
          where: { id, companyId },
          data: { lastRun: now, nextRun },
        });

        for (const recipient of report.recipients || []) {
          await EmailService.sendScheduledReportNotification(
            recipient,
            report.name,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports`
          );
        }

        logger.info(`Scheduled report ${id} generated successfully`);
      } catch (error) {
        logger.error(`Error running scheduled report ${id}:`, error);
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
  private static calculateNextRun(cronExpression: string, from = new Date()): Date {
    const interval = cronParser.parse(cronExpression, { currentDate: from });
    return interval.next().toDate();
  }

  /**
   * Get all scheduled reports for a company
   */
  static async getScheduledReports(companyId: string): Promise<ScheduledReport[]> {
    const rows = await prisma.scheduledReport.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: any) => this.toScheduledReport(row));
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    id: string,
    companyId: string,
    updates: Partial<ScheduledReport>
  ): Promise<ScheduledReport> {
    this.removeSchedule(id);
    const current = await prisma.scheduledReport.findFirst({
      where: { id, companyId },
    });
    if (!current) {
      throw new Error('Scheduled report not found');
    }

    const nextSchedule = updates.schedule || current.schedule;
    if (!cron.validate(nextSchedule)) {
      throw new Error(`Invalid cron expression: ${nextSchedule}`);
    }
    const row = await prisma.scheduledReport.updateMany({
      where: { id, companyId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.schedule !== undefined && { schedule: updates.schedule }),
        ...(updates.options !== undefined && { options: updates.options as unknown as Prisma.InputJsonValue }),
        ...(updates.recipients !== undefined && { recipients: updates.recipients }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        nextRun: this.calculateNextRun(nextSchedule),
      },
    });
    if (!row.count) {
      throw new Error('Scheduled report not found');
    }

    const updated = await prisma.scheduledReport.findFirst({
      where: { id, companyId },
    });

    if (updated?.enabled) {
      this.scheduleReport(id, companyId, {
        name: updated.name,
        type: updated.type as ScheduledReport['type'],
        schedule: updated.schedule,
        options: updated.options as unknown as ReportOptions,
        recipients: updated.recipients || [],
        enabled: updated.enabled,
      });
    }

    return this.toScheduledReport(updated);
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(id: string, companyId: string): Promise<void> {
    this.removeSchedule(id);
    await prisma.scheduledReport.deleteMany({
      where: { id, companyId },
    });
  }

  private static toScheduledReport(row: any): ScheduledReport {
    return {
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      type: row.type,
      schedule: row.schedule,
      options: row.options as ReportOptions,
      recipients: row.recipients || [],
      enabled: row.enabled,
      lastRun: row.lastRun ?? undefined,
      nextRun: row.nextRun ?? undefined,
    };
  }
}

export { ScheduledReportsService, ScheduledReport };
