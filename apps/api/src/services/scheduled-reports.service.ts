import * as cron from 'node-cron';
import { prisma } from './prisma.client';
import { PDFReportService, ReportOptions } from './pdf-report.service';
import { logger } from '../utils/logger';

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

  /**
   * Initialize scheduled reports for a company
   */
  static async initializeCompanyReports(companyId: string) {
    // In a real implementation, load from database
    // For now, we'll just set up the infrastructure
    logger.info(`Initialized scheduled reports for company ${companyId}`);
  }

  /**
   * Create a scheduled report
   */
  static async createScheduledReport(
    companyId: string,
    report: Omit<ScheduledReport, 'id' | 'lastRun' | 'nextRun'>
  ): Promise<ScheduledReport> {
    // In a real implementation, save to database
    // For now, we'll create the schedule
    const id = `sched_${Date.now()}`;
    
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
        
        // In a real implementation, send email with PDF attachment
        // For now, just log
        logger.info(`Scheduled report ${id} generated successfully`);
        
        // Update lastRun in database
        // await prisma.scheduledReport.update({ where: { id }, data: { lastRun: new Date() } });
        
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
    // In a real implementation, load from database
    return [];
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    id: string,
    companyId: string,
    updates: Partial<ScheduledReport>
  ): Promise<ScheduledReport> {
    // In a real implementation, update in database and reschedule
    this.removeSchedule(id);
    
    if (updates.enabled) {
      // Reschedule with updated options
    }
    
    return {} as ScheduledReport;
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(id: string, companyId: string): Promise<void> {
    this.removeSchedule(id);
    // In a real implementation, delete from database
  }
}

export { ScheduledReportsService, ScheduledReport };
