import { ScheduledReportsService } from '../services/scheduled-reports.service';
import { prisma } from '../services/prisma.client';
import { EmailService } from '../services/email.service';
import { PDFReportService } from '../services/pdf-report.service';
import * as cron from 'node-cron';

jest.mock('../services/prisma.client', () => {
  const prismaMock: Record<string, unknown> = {
    scheduledReport: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

jest.mock('../services/pdf-report.service', () => ({
  PDFReportService: {
    generatePDF: jest.fn(),
  },
}));

jest.mock('../services/email.service', () => ({
  EmailService: {
    sendScheduledReportNotification: jest.fn(),
  },
}));

jest.mock('node-cron', () => ({
  validate: jest.fn(() => true),
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

describe('ScheduledReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and returns a persisted scheduled report', async () => {
    jest.mocked((prisma as any).scheduledReport.create).mockResolvedValue({
      id: 'sched-1',
      companyId: 'co-1',
      name: 'Weekly Risk',
      type: 'risk-assessment',
      schedule: '0 9 * * 1',
      options: { type: 'risk-assessment' },
      recipients: ['ops@example.com'],
      enabled: true,
      lastRun: null,
      nextRun: new Date('2026-04-30T09:00:00.000Z'),
    });

    const out = await ScheduledReportsService.createScheduledReport('co-1', {
      name: 'Weekly Risk',
      type: 'risk-assessment',
      schedule: '0 9 * * 1',
      options: { type: 'risk-assessment' },
      recipients: ['ops@example.com'],
      enabled: true,
    });

    expect((prisma as any).scheduledReport.create).toHaveBeenCalled();
    expect(out.id).toBe('sched-1');
    expect(out.companyId).toBe('co-1');
  });

  it('lists scheduled reports from database', async () => {
    jest.mocked((prisma as any).scheduledReport.findMany).mockResolvedValue([
      {
        id: 'sched-2',
        companyId: 'co-1',
        name: 'Monthly Compliance',
        type: 'compliance',
        schedule: '0 9 1 * *',
        options: { type: 'compliance' },
        recipients: ['audit@example.com'],
        enabled: true,
        lastRun: null,
        nextRun: new Date('2026-05-01T09:00:00.000Z'),
      },
    ]);

    const rows = await ScheduledReportsService.getScheduledReports('co-1');

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('compliance');
  });

  it('updates a scheduled report', async () => {
    jest.mocked((prisma as any).scheduledReport.findFirst)
      .mockResolvedValueOnce({
        id: 'sched-3',
        companyId: 'co-1',
        name: 'Daily Report',
        type: 'risk-assessment',
        schedule: '0 9 * * *',
        options: { type: 'risk-assessment' },
        recipients: ['a@example.com'],
        enabled: true,
      })
      .mockResolvedValueOnce({
        id: 'sched-3',
        companyId: 'co-1',
        name: 'Daily Report Updated',
        type: 'risk-assessment',
        schedule: '0 9 * * *',
        options: { type: 'risk-assessment' },
        recipients: ['a@example.com'],
        enabled: true,
        lastRun: null,
        nextRun: new Date('2026-04-24T09:00:00.000Z'),
      });
    jest.mocked((prisma as any).scheduledReport.updateMany).mockResolvedValue({ count: 1 });

    const updated = await ScheduledReportsService.updateScheduledReport('sched-3', 'co-1', {
      name: 'Daily Report Updated',
    });

    expect(updated.name).toBe('Daily Report Updated');
    expect((prisma as any).scheduledReport.updateMany).toHaveBeenCalled();
  });

  it('runs scheduled callback and updates run metadata', async () => {
    const callbackHolder: { fn?: () => Promise<void> } = {};
    jest.mocked(cron.schedule).mockImplementation(((_expr: string, fn: () => Promise<void>) => {
      callbackHolder.fn = fn;
      return { stop: jest.fn() } as any;
    }) as any);
    jest.mocked((prisma as any).scheduledReport.findMany).mockResolvedValue([
      {
        id: 'sched-4',
        companyId: 'co-1',
        name: 'Weekly',
        type: 'risk-assessment',
        schedule: '0 9 * * 1',
        options: { type: 'risk-assessment' },
        recipients: ['ops@example.com'],
        enabled: true,
      },
    ]);
    jest.mocked((PDFReportService as any).generatePDF).mockResolvedValue(Buffer.from('pdf'));
    jest.mocked((prisma as any).scheduledReport.updateMany).mockResolvedValue({ count: 1 });

    await ScheduledReportsService.initializeCompanyReports('co-1');
    await callbackHolder.fn?.();

    expect(PDFReportService.generatePDF).toHaveBeenCalled();
    expect((prisma as any).scheduledReport.updateMany).toHaveBeenCalled();
    expect(EmailService.sendScheduledReportNotification).toHaveBeenCalledWith(
      'ops@example.com',
      'Weekly',
      expect.stringContaining('/reports'),
    );
  });
});
