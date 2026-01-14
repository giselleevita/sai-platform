import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { BadRequestError } from '../errors/AppError';
import { PDFReportService, ReportOptions } from '../services/pdf-report.service';

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
      const tools = await prisma.aITool.findMany({
        where: { companyId },
        orderBy: { riskScore: 'desc' },
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
      console.error('Error generating risk assessment report:', error);
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
      const tools = await prisma.aITool.findMany({
        where: { companyId },
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
      console.error('Error generating compliance report:', error);
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
      console.error('Error generating executive summary:', error);
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
      console.error('Error generating custom report:', error);
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
}
