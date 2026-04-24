import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { BadRequestError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { PDFReportService, ReportOptions } from '../services/pdf-report.service';
import { ReportExportService } from '../services/report-export.service';
import { EntitlementsService } from '../services/entitlements.service';
import archiver from 'archiver';
import { getAttachmentStorage } from '../services/attachments';

export class ReportController {
  /**
   * Generate Risk Assessment Report
   * GET /api/reports/risk-assessment?format=pdf|json
   */
  static async generateRiskAssessment(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const format = req.query.format as string || 'json';
    const includeCharts = req.query.charts === 'true';

    try {
      if (format === 'pdf') {
        const pdf = await PDFReportService.generatePDF(companyId, {
          type: 'risk-assessment',
          includeCharts,
          dateRange: req.query.start && req.query.end
            ? { start: req.query.start as string, end: req.query.end as string }
            : undefined,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="risk-assessment-${new Date().toISOString().split('T')[0]}.pdf"`
        );
        res.send(pdf);
        return;
      }

      // JSON format (backward compatibility)
      const max = 2000;
      const limit = Math.max(1, Math.min(Number(req.query.limit || '500'), max));
      const tools = await prisma.aITool.findMany({
        where: { companyId },
        orderBy: { riskScore: 'desc' },
        take: limit,
      });

      const risks = await prisma.risk.findMany({
        where: { companyId },
        include: {
          controls: {
            include: {
              control: true,
            },
          },
          decisions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const report = {
        generatedAt: new Date().toISOString(),
        companyId,
        summary: {
          totalTools: tools.length,
          highRiskTools: tools.filter((t) => t.riskLevel === 'High' || t.riskLevel === 'Critical').length,
          mediumRiskTools: tools.filter((t) => t.riskLevel === 'Medium').length,
          lowRiskTools: tools.filter((t) => t.riskLevel === 'Low').length,
          totalRisks: risks.length,
          acceptedRisks: risks.filter((r) => r.decisions?.[0]?.decision === 'ACCEPTED').length,
          deferredRisks: risks.filter((r) => r.decisions?.[0]?.decision === 'DEFERRED').length,
          rejectedRisks: risks.filter((r) => r.decisions?.[0]?.decision === 'REJECTED').length,
        },
        tools: tools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          category: tool.category,
          riskScore: tool.riskScore,
          riskLevel: tool.riskLevel,
          dataTypes: tool.dataTypes,
          users: tool.users,
        })),
        risks: risks.map((risk) => ({
          id: risk.id,
          title: risk.title,
          category: risk.category,
          likelihood: risk.likelihood,
          impact: risk.impact,
          score: risk.likelihood * risk.impact,
          latestDecision: risk.decisions?.[0] || null,
          controlsCount: risk.controls.length,
        })),
      };

      res.json({ success: true, data: report });
    } catch (error: any) {
      logger.error('Error generating risk assessment report', error);
      throw new BadRequestError(error?.message || 'Failed to generate risk assessment report');
    }
  }

  /**
   * Generate Compliance Report
   * GET /api/reports/compliance?format=pdf|json
   */
  static async generateCompliance(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const format = req.query.format as string || 'json';
    const includeCharts = req.query.charts === 'true';

    try {
      if (format === 'pdf') {
        const pdf = await PDFReportService.generatePDF(companyId, {
          type: 'compliance',
          includeCharts,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="compliance-report-${new Date().toISOString().split('T')[0]}.pdf"`
        );
        res.send(pdf);
        return;
      }

      // JSON format (backward compatibility)
      const max = 2000;
      const limit = Math.max(1, Math.min(Number(req.query.limit || '500'), max));
      const tools = await prisma.aITool.findMany({
        where: { companyId },
        take: limit,
      });

      const policies = await prisma.policy.findMany({
        where: { companyId },
        include: {
          controls: {
            include: {
              evidence: true,
            },
          },
        },
        take: limit,
      });

      const regulations = await prisma.regulation.findMany({
        where: { companyId },
        include: {
          controls: {
            include: {
              control: {
                include: {
                  evidence: true,
                },
              },
            },
          },
        },
        take: limit,
      });

      const report = {
        generatedAt: new Date().toISOString(),
        companyId,
        summary: {
          totalTools: tools.length,
          toolsWithDPA: tools.filter((t) => t.hasDPA).length,
          toolsWithoutDPA: tools.filter((t) => !t.hasDPA).length,
          totalPolicies: policies.length,
          activePolicies: policies.filter((p) => p.status === 'ACTIVE').length,
          totalControls: policies.reduce((sum, p) => sum + p.controls.length, 0),
          totalRegulations: regulations.length,
        },
        complianceByFramework: regulations.map((reg) => {
          const controls = reg.controls.map((cr) => cr.control);
          const evidenceCount = controls.reduce((sum, c) => sum + c.evidence.length, 0);
          const approvedEvidence = controls.reduce(
            (sum, c) => sum + c.evidence.filter((e) => e.status === 'APPROVED').length,
            0
          );

          return {
            framework: reg.framework,
            article: reg.article,
            name: reg.name,
            controlsCount: controls.length,
            evidenceCount,
            approvedEvidence,
            coverage: controls.length > 0 ? (approvedEvidence / controls.length) * 100 : 0,
          };
        }),
        policyCompliance: policies.map((policy) => ({
          id: policy.id,
          name: policy.name,
          status: policy.status,
          controlsCount: policy.controls.length,
          evidenceCount: policy.controls.reduce((sum, c) => sum + c.evidence.length, 0),
        })),
        toolsCompliance: tools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          hasDPA: tool.hasDPA,
          dataResidency: tool.dataResidency,
          riskLevel: tool.riskLevel,
          compliant: tool.hasDPA && (tool.riskLevel === 'Low' || tool.riskLevel === 'Medium'),
        })),
      };

      res.json({ success: true, data: report });
    } catch (error: any) {
      logger.error('Error generating compliance report', error);
      throw new BadRequestError(error?.message || 'Failed to generate compliance report');
    }
  }

  /**
   * Generate Executive Summary Report
   * GET /api/reports/executive-summary?format=pdf|json
   */
  static async generateExecutiveSummary(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const format = req.query.format as string || 'pdf';
    const includeCharts = req.query.charts === 'true';

    try {
      if (format === 'pdf') {
        const pdf = await PDFReportService.generatePDF(companyId, {
          type: 'executive-summary',
          includeCharts,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="executive-summary-${new Date().toISOString().split('T')[0]}.pdf"`
        );
        res.send(pdf);
        return;
      }

      res.status(400).json({ success: false, error: 'Executive summary only available as PDF' });
    } catch (error: any) {
      logger.error('Error generating executive summary', error);
      throw new BadRequestError(error?.message || 'Failed to generate executive summary');
    }
  }

  /**
   * Generate Custom Report
   * POST /api/reports/custom
   */
  static async generateCustom(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { sections, includeCharts, dateRange, filters } = req.body;
    const format = req.query.format as string || 'pdf';

    try {
      const pdf = await PDFReportService.generatePDF(companyId, {
        type: 'custom',
        sections,
        includeCharts,
        dateRange,
        filters,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="custom-report-${new Date().toISOString().split('T')[0]}.pdf"`
      );
      res.send(pdf);
    } catch (error: any) {
      logger.error('Error generating custom report', error);
      throw new BadRequestError(error?.message || 'Failed to generate custom report');
    }
  }

  /**
   * Get scheduled reports
   * GET /api/reports/scheduled
   */
  static async getScheduledReports(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const { ScheduledReportsService } = await import('../services/scheduled-reports.service');
      const reports = await ScheduledReportsService.getScheduledReports(companyId);
      res.json({ success: true, data: reports });
    } catch (error: any) {
      throw new BadRequestError(error?.message || 'Failed to get scheduled reports');
    }
  }

  /**
   * Create scheduled report
   * POST /api/reports/scheduled
   */
  static async createScheduledReport(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const { ScheduledReportsService } = await import('../services/scheduled-reports.service');
      const report = await ScheduledReportsService.createScheduledReport(companyId, req.body);
      res.status(201).json({ success: true, data: report });
    } catch (error: any) {
      throw new BadRequestError(error?.message || 'Failed to create scheduled report');
    }
  }

  /**
   * Update scheduled report
   * PATCH /api/reports/scheduled/:id
   */
  static async updateScheduledReport(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const { ScheduledReportsService } = await import('../services/scheduled-reports.service');
      const report = await ScheduledReportsService.updateScheduledReport(req.params.id, companyId, req.body);
      res.json({ success: true, data: report });
    } catch (error: any) {
      throw new BadRequestError(error?.message || 'Failed to update scheduled report');
    }
  }

  /**
   * Delete scheduled report
   * DELETE /api/reports/scheduled/:id
   */
  static async deleteScheduledReport(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const { ScheduledReportsService } = await import('../services/scheduled-reports.service');
      await ScheduledReportsService.deleteScheduledReport(req.params.id, companyId);
      res.json({ success: true });
    } catch (error: any) {
      throw new BadRequestError(error?.message || 'Failed to delete scheduled report');
    }
  }

  /**
   * GET /api/reports/compliance-export
   * Export compliance package (PDF payload encoded in base64)
   */
  static async exportCompliance(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const enabled = await EntitlementsService.getBool(companyId, 'report_exports_enabled');
    if (enabled === false) {
      throw new BadRequestError('Report exports are disabled for your plan');
    }
    const maxPerDay = await EntitlementsService.getInt(companyId, 'max_report_exports_per_day');
    if (typeof maxPerDay === 'number') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const exports = await prisma.auditLog.count({
        where: { companyId, action: 'REPORT_EXPORT', createdAt: { gte: since } },
      });
      if (exports >= maxPerDay) {
        throw new BadRequestError(`Plan limit reached: max_report_exports_per_day=${maxPerDay}`);
      }
    }

    const data = await ReportExportService.exportCompliancePdf(companyId);

    await prisma.auditLog.create({
      data: {
        companyId,
        actorId: req.user?.id || null,
        action: 'REPORT_EXPORT',
        targetType: 'Report',
        targetId: null,
        changes: { type: 'compliance-export' } as any,
      },
    });

    // `base64Payload` is used as transport for now; return correct headers and raw bytes for UX correctness.
    const buf = Buffer.from(data.base64Payload, 'base64');
    res.setHeader('Content-Type', data.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${data.filename.replace(/\"/g, '')}"`);
    res.send(buf);
  }

  /**
   * GET /api/reports/audit-package
   * JSON manifest for auditors (evidence, controls, snapshots, recent audit log).
   */
  static async generateAuditPackage(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const enabled = await EntitlementsService.getBool(companyId, 'report_exports_enabled');
    if (enabled === false) {
      throw new BadRequestError('Report exports are disabled for your plan');
    }
    const maxPerDay = await EntitlementsService.getInt(companyId, 'max_report_exports_per_day');
    if (typeof maxPerDay === 'number') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const exports = await prisma.auditLog.count({
        where: { companyId, action: 'REPORT_EXPORT', createdAt: { gte: since } },
      });
      if (exports >= maxPerDay) {
        throw new BadRequestError(`Plan limit reached: max_report_exports_per_day=${maxPerDay}`);
      }
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        actorId: req.user?.id || null,
        action: 'REPORT_EXPORT',
        targetType: 'Report',
        targetId: null,
        changes: { type: 'audit-package' } as any,
      },
    });

    const [snapshots, evidence, controls, policies, risks, auditTail] = await Promise.all([
      prisma.complianceSnapshot.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 24,
      }),
      prisma.evidence.findMany({
        where: { companyId },
        include: { control: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
      prisma.control.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
      prisma.policy.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
      prisma.risk.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    res.json({
      success: true,
      data: {
        type: 'audit-package',
        generatedAt: new Date().toISOString(),
        companyId,
        snapshots,
        evidence,
        controls,
        policies,
        risks,
        recentAuditLog: auditTail,
      },
    });
  }

  /**
   * GET /api/reports/auditor-zip
   * Unified export: audit-package + governance manifest + (optionally) attachments.
   */
  static async downloadAuditorZip(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const enabled = await EntitlementsService.getBool(companyId, 'report_exports_enabled');
    if (enabled === false) {
      throw new BadRequestError('Report exports are disabled for your plan');
    }
    const maxPerDay = await EntitlementsService.getInt(companyId, 'max_report_exports_per_day');
    if (typeof maxPerDay === 'number') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const exports = await prisma.auditLog.count({
        where: { companyId, action: 'REPORT_EXPORT', createdAt: { gte: since } },
      });
      if (exports >= maxPerDay) {
        throw new BadRequestError(`Plan limit reached: max_report_exports_per_day=${maxPerDay}`);
      }
    }

    const includeAttachments = (req.query.includeAttachments as string | undefined) !== 'false';
    const maxAttachments = Math.max(0, Math.min(Number(req.query.maxAttachments || '200'), 500));
    const maxTotalBytes = Math.max(1, Math.min(Number(req.query.maxTotalBytes || String(200 * 1024 * 1024)), 1024 * 1024 * 1024));

    await prisma.auditLog.create({
      data: {
        companyId,
        actorId: req.user?.id || null,
        action: 'REPORT_EXPORT',
        targetType: 'Report',
        targetId: null,
        changes: {
          type: 'auditor-zip',
          includeAttachments,
          maxAttachments,
          maxTotalBytes,
        } as any,
      },
    });

    const generatedAt = new Date().toISOString();

    const [auditPkg, snapshots, evidence, attachments] = await Promise.all([
      (async () => {
        const [snapshots, evidence, controls, policies, risks, auditTail] = await Promise.all([
          prisma.complianceSnapshot.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 24,
          }),
          prisma.evidence.findMany({
            where: { companyId },
            include: { control: { select: { id: true, name: true } } },
            orderBy: { updatedAt: 'desc' },
            take: 500,
          }),
          prisma.control.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' },
            take: 500,
          }),
          prisma.policy.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' },
            take: 200,
          }),
          prisma.risk.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' },
            take: 200,
          }),
          prisma.auditLog.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 200,
          }),
        ]);
        return {
          type: 'audit-package',
          generatedAt,
          companyId,
          snapshots,
          evidence,
          controls,
          policies,
          risks,
          recentAuditLog: auditTail,
        };
      })(),
      prisma.complianceSnapshot.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, summary: true },
        take: 100,
      }),
      prisma.evidence.findMany({
        where: { companyId },
        select: { id: true, controlId: true, status: true, contentHash: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000,
      }),
      prisma.evidenceAttachment.findMany({
        where: { companyId },
        select: { id: true, evidenceId: true, filename: true, contentType: true, sha256: true, sizeBytes: true, createdAt: true, storagePath: true },
        orderBy: { createdAt: 'desc' },
        take: Math.max(0, maxAttachments),
      }),
    ]);

    // Build a manifest payload consistent with GovernanceExportController
    const sha256Json = (obj: unknown): string =>
      require('crypto').createHash('sha256').update(JSON.stringify(obj ?? null)).digest('hex');

    const byEvidence = new Map<string, any[]>();
    for (const a of attachments) {
      const arr = byEvidence.get(a.evidenceId) ?? [];
      arr.push(a);
      byEvidence.set(a.evidenceId, arr);
    }

    const governanceManifest = {
      generatedAt,
      companyId,
      snapshots: snapshots.map((s) => ({ id: s.id, createdAt: s.createdAt, sha256: sha256Json(s.summary) })),
      evidence: evidence.map((e) => ({
        id: e.id,
        controlId: e.controlId,
        status: e.status,
        contentHash: e.contentHash,
        updatedAt: e.updatedAt,
        attachments: (byEvidence.get(e.id) ?? []).map((a) => ({
          id: a.id,
          filename: a.filename,
          sha256: a.sha256,
          sizeBytes: a.sizeBytes,
          createdAt: a.createdAt,
        })),
      })),
    };

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sai-auditor-export-${generatedAt.slice(0, 10)}.zip"`
    );

    const zip = archiver('zip', { zlib: { level: 9 } });
    zip.on('warning', (err) => logger.warn('ZIP warning', err));
    zip.on('error', (err) => {
      logger.error('ZIP error', err);
      res.status(500).end();
    });
    zip.pipe(res);

    zip.append(JSON.stringify(auditPkg, null, 2), { name: 'audit-package.json' });
    zip.append(JSON.stringify(governanceManifest, null, 2), { name: 'governance-manifest.json' });

    const attachmentsIndexLines = ['attachmentId,evidenceId,filename,sha256,sizeBytes,createdAt,zipPath'];
    let totalBytes = 0;

    if (includeAttachments) {
      const { storage } = getAttachmentStorage();
      for (const a of attachments) {
        totalBytes += a.sizeBytes || 0;
        if (totalBytes > maxTotalBytes) break;
        const safeName = String(a.filename || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
        const zipPath = `attachments/${a.evidenceId}/${a.id}-${safeName}`;
        try {
          const stream = await storage.getObjectStream({ key: a.storagePath });
          zip.append(stream as any, { name: zipPath });
          attachmentsIndexLines.push(
            [
              a.id,
              a.evidenceId,
              JSON.stringify(a.filename || ''),
              a.sha256,
              String(a.sizeBytes || 0),
              new Date(a.createdAt).toISOString(),
              zipPath,
            ].join(',')
          );
        } catch (e) {
          attachmentsIndexLines.push(
            [a.id, a.evidenceId, JSON.stringify(a.filename || ''), a.sha256, String(a.sizeBytes || 0), new Date(a.createdAt).toISOString(), 'ERROR'].join(',')
          );
        }
      }
    }

    zip.append(attachmentsIndexLines.join('\n') + '\n', { name: 'attachments.csv' });
    await zip.finalize();
  }
}
