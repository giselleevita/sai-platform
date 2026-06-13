import puppeteer from 'puppeteer';
import { prisma } from './prisma.client';

// Note: puppeteer may need to be installed with: npm install puppeteer
// If puppeteer fails, you can use pdfkit as an alternative

export interface ReportOptions {
  type: 'risk-assessment' | 'compliance' | 'executive-summary' | 'custom';
  includeCharts?: boolean;
  dateRange?: { start: string; end: string };
  sections?: string[];
  filters?: Record<string, any>;
}

export class PDFReportService {
  /**
   * Generate PDF report
   */
  static async generatePDF(companyId: string, options: ReportOptions): Promise<Buffer> {
    let html: string;
    
    switch (options.type) {
      case 'risk-assessment':
        html = await this.generateRiskAssessmentHTML(companyId, options);
        break;
      case 'compliance':
        html = await this.generateComplianceHTML(companyId, options);
        break;
      case 'executive-summary':
        html = await this.generateExecutiveSummaryHTML(companyId, options);
        break;
      default:
        html = await this.generateCustomHTML(companyId, options);
    }

    return this.htmlToPDF(html);
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  private static async htmlToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Risk Assessment Report HTML
   */
  private static async generateRiskAssessmentHTML(
    companyId: string,
    options: ReportOptions
  ): Promise<string> {
    const tools = await prisma.aITool.findMany({
      where: { companyId },
      orderBy: { riskScore: 'desc' },
    });

    const risks = await prisma.risk.findMany({
      where: { companyId },
      include: {
        controls: { include: { control: true } },
        decisions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Risk trend data (last 30 days)
    const riskScores = await prisma.riskScore.findMany({
      where: {
        companyId,
        createdAt: options.dateRange?.start
          ? { gte: new Date(options.dateRange.start) }
          : { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      totalTools: tools.length,
      highRiskTools: tools.filter((t) => t.riskLevel === 'High' || t.riskLevel === 'Critical').length,
      mediumRiskTools: tools.filter((t) => t.riskLevel === 'Medium').length,
      lowRiskTools: tools.filter((t) => t.riskLevel === 'Low').length,
      totalRisks: risks.length,
      acceptedRisks: risks.filter((r) => r.decisions?.[0]?.decision === 'ACCEPTED').length,
      deferredRisks: risks.filter((r) => r.decisions?.[0]?.decision === 'DEFERRED').length,
      rejectedRisks: risks.filter((r) => r.decisions?.[0]?.decision === 'REJECTED').length,
    };

    // Group risk scores by date for trend
    const trendData = this.calculateRiskTrend(riskScores);

    return this.getReportHTML({
      title: 'Risk Assessment Report',
      summary,
      sections: [
        {
          title: 'Executive Summary',
          content: this.generateExecutiveSummarySection(summary, tools, risks),
        },
        {
          title: 'Risk Trend Analysis',
          content: options.includeCharts
            ? this.generateRiskTrendChart(trendData)
            : this.generateRiskTrendTable(trendData),
        },
        {
          title: 'AI Tools Risk Register',
          content: this.generateToolsTable(tools),
        },
        {
          title: 'Risk Register',
          content: this.generateRisksTable(risks),
        },
      ],
    });
  }

  /**
   * Generate Compliance Report HTML
   */
  private static async generateComplianceHTML(
    companyId: string,
    options: ReportOptions
  ): Promise<string> {
    const tools = await prisma.aITool.findMany({ where: { companyId } });
    const policies = await prisma.policy.findMany({
      where: { companyId },
      include: { controls: { include: { evidence: true } } },
    });
    const regulations = await prisma.regulation.findMany({
      where: { companyId },
      include: {
        controls: {
          include: {
            control: {
              include: { evidence: true },
            },
          },
        },
      },
    });

    const gapAnalysis = this.calculateComplianceGaps(tools, policies, regulations);

    return this.getReportHTML({
      title: 'Compliance Report',
      summary: {
        totalTools: tools.length,
        toolsWithDPA: tools.filter((t) => t.hasDPA).length,
        totalPolicies: policies.length,
        activePolicies: policies.filter((p) => p.status === 'ACTIVE').length,
        totalRegulations: regulations.length,
        complianceScore: gapAnalysis.overallScore,
      },
      sections: [
        {
          title: 'Executive Summary',
          content: this.generateComplianceExecutiveSummary(tools, policies, regulations),
        },
        {
          title: 'Compliance Gap Analysis',
          content: this.generateGapAnalysisSection(gapAnalysis),
        },
        {
          title: 'Framework Compliance',
          content: this.generateFrameworkComplianceTable(regulations),
        },
        {
          title: 'Policy Compliance',
          content: this.generatePolicyComplianceTable(policies),
        },
        {
          title: 'Tool Compliance Status',
          content: this.generateToolComplianceTable(tools),
        },
      ],
    });
  }

  /**
   * Generate Executive Summary HTML
   */
  private static async generateExecutiveSummaryHTML(
    companyId: string,
    options: ReportOptions
  ): Promise<string> {
    const tools = await prisma.aITool.findMany({ where: { companyId } });
    const risks = await prisma.risk.findMany({ where: { companyId } });
    const policies = await prisma.policy.findMany({ where: { companyId } });
    const incidents = await prisma.incident.findMany({ where: { companyId } });

    const riskTrend = await this.calculateRiskTrend(
      await prisma.riskScore.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
    );

    return this.getReportHTML({
      title: 'Executive Summary',
      summary: {
        totalTools: tools.length,
        totalRisks: risks.length,
        totalPolicies: policies.length,
        totalIncidents: incidents.length,
      },
      sections: [
        {
          title: 'Key Metrics',
          content: this.generateKeyMetricsSection(tools, risks, policies, incidents),
        },
        {
          title: 'Risk Overview',
          content: options.includeCharts
            ? this.generateRiskTrendChart(riskTrend)
            : this.generateRiskOverviewTable(tools),
        },
        {
          title: 'Compliance Status',
          content: this.generateComplianceStatusSection(tools, policies),
        },
        {
          title: 'Recommendations',
          content: this.generateRecommendationsSection(tools, risks),
        },
      ],
    });
  }

  /**
   * Generate Custom Report HTML
   */
  private static async generateCustomHTML(
    companyId: string,
    options: ReportOptions
  ): Promise<string> {
    const sections: Array<{ title: string; content: string }> = [];

    if (options.sections?.includes('risk-assessment')) {
      sections.push({
        title: 'Risk Assessment',
        content: await this.generateRiskAssessmentHTML(companyId, options),
      });
    }

    if (options.sections?.includes('compliance')) {
      sections.push({
        title: 'Compliance',
        content: await this.generateComplianceHTML(companyId, options),
      });
    }

    return this.getReportHTML({
      title: 'Custom Report',
      summary: {},
      sections,
    });
  }

  /**
   * Calculate risk trend over time
   */
  private static calculateRiskTrend(riskScores: any[]): Array<{ date: string; avgScore: number; count: number }> {
    const grouped = riskScores.reduce((acc, score) => {
      const date = new Date(score.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { scores: [], count: 0 };
      }
      acc[date].scores.push(score.score);
      acc[date].count++;
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    return Object.entries(grouped)
      .map((entry) => {
        const [date, data] = entry as [string, { scores: number[]; count: number }];
        return {
          date,
          avgScore: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
          count: data.count,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate compliance gaps
   */
  private static calculateComplianceGaps(tools: any[], policies: any[], regulations: any[]) {
    const gaps: Array<{ category: string; issue: string; severity: string; recommendation: string }> = [];
    
    // Check DPA gaps
    const toolsWithoutDPA = tools.filter((t) => !t.hasDPA && (t.dataTypes.includes('PII') || t.dataTypes.includes('Financial')));
    toolsWithoutDPA.forEach((tool) => {
      gaps.push({
        category: 'Data Protection',
        issue: `${tool.name} processes PII/Financial data without DPA`,
        severity: 'High',
        recommendation: 'Execute Data Processing Agreement with vendor',
      });
    });

    // Check policy gaps
    const inactivePolicies = policies.filter((p) => p.status !== 'ACTIVE');
    inactivePolicies.forEach((policy) => {
      gaps.push({
        category: 'Policy',
        issue: `Policy "${policy.name}" is not active`,
        severity: 'Medium',
        recommendation: 'Review and activate policy or mark as deprecated',
      });
    });

    // Check control evidence gaps
    policies.forEach((policy) => {
      policy.controls.forEach((control: any) => {
        const approvedEvidence = control.evidence.filter((e: any) => e.status === 'APPROVED');
        if (approvedEvidence.length === 0) {
          gaps.push({
            category: 'Evidence',
            issue: `Control "${control.name}" has no approved evidence`,
            severity: 'Medium',
            recommendation: 'Collect and approve evidence for this control',
          });
        }
      });
    });

    const overallScore = tools.length > 0
      ? Math.round(((tools.length - gaps.filter((g) => g.severity === 'High').length) / tools.length) * 100)
      : 100;

    return { gaps, overallScore };
  }

  /**
   * Generate HTML template
   */
  private static getReportHTML(data: {
    title: string;
    summary: Record<string, any>;
    sections: Array<{ title: string; content: string }>;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; }
    .header { background: #1e40af; color: white; padding: 30px; margin-bottom: 30px; }
    .header h1 { font-size: 28pt; margin-bottom: 10px; }
    .header .meta { font-size: 10pt; opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #1e40af; }
    .summary-card h3 { font-size: 9pt; color: #6b7280; margin-bottom: 5px; }
    .summary-card .value { font-size: 24pt; font-weight: bold; color: #1e40af; }
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section h2 { font-size: 18pt; color: #1e40af; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #1e40af; color: white; padding: 10px; text-align: left; font-size: 10pt; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
    tr:nth-child(even) { background: #f9fafb; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 9pt; font-weight: bold; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fed7aa; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #d1fae5; color: #065f46; }
    .chart-placeholder { background: #f3f4f6; padding: 40px; text-align: center; border-radius: 8px; margin: 15px 0; }
    .gap-item { margin: 10px 0; padding: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; }
    .gap-item.high { background: #fee2e2; border-left-color: #dc2626; }
    .gap-item.medium { background: #fef3c7; border-left-color: #f59e0b; }
    .gap-item.low { background: #d1fae5; border-left-color: #10b981; }
    @media print { .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <div class="meta">Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })}</div>
  </div>

  <div class="summary">
    ${Object.entries(data.summary)
      .map(([key, value]) => `
        <div class="summary-card">
          <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</h3>
          <div class="value">${value}</div>
        </div>
      `)
      .join('')}
  </div>

  ${data.sections.map((section) => `
    <div class="section">
      <h2>${section.title}</h2>
      ${section.content}
    </div>
  `).join('')}
</body>
</html>`;
  }

  // Helper methods for generating content sections
  private static generateExecutiveSummarySection(summary: any, tools: any[], risks: any[]): string {
    return `
      <p><strong>Total AI Tools:</strong> ${summary.totalTools}</p>
      <p><strong>High/Critical Risk Tools:</strong> ${summary.highRiskTools}</p>
      <p><strong>Total Risks:</strong> ${summary.totalRisks}</p>
      <p><strong>Accepted Risks:</strong> ${summary.acceptedRisks}</p>
    `;
  }

  private static generateRiskTrendChart(trendData: any[]): string {
    return `
      <div class="chart-placeholder">
        <p><strong>Risk Trend Chart</strong></p>
        <p>Average Risk Score Over Time</p>
        <table>
          <tr><th>Date</th><th>Avg Score</th><th>Tools Assessed</th></tr>
          ${trendData.map((d) => `
            <tr>
              <td>${d.date}</td>
              <td>${Math.round(d.avgScore)}</td>
              <td>${d.count}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  private static generateRiskTrendTable(trendData: any[]): string {
    return this.generateRiskTrendChart(trendData);
  }

  private static generateToolsTable(tools: any[]): string {
    return `
      <table>
        <tr>
          <th>Tool Name</th>
          <th>Category</th>
          <th>Risk Score</th>
          <th>Risk Level</th>
          <th>Users</th>
        </tr>
        ${tools.map((tool) => `
          <tr>
            <td>${tool.name}</td>
            <td>${tool.category}</td>
            <td>${tool.riskScore}</td>
            <td><span class="badge badge-${tool.riskLevel.toLowerCase()}">${tool.riskLevel}</span></td>
            <td>${tool.users}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private static generateRisksTable(risks: any[]): string {
    return `
      <table>
        <tr>
          <th>Risk Title</th>
          <th>Likelihood</th>
          <th>Impact</th>
          <th>Score</th>
          <th>Decision</th>
        </tr>
        ${risks.map((risk) => `
          <tr>
            <td>${risk.title}</td>
            <td>${risk.likelihood}/5</td>
            <td>${risk.impact}/5</td>
            <td>${risk.likelihood * risk.impact}</td>
            <td>${risk.decisions?.[0]?.decision || 'Pending'}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private static generateComplianceExecutiveSummary(tools: any[], policies: any[], regulations: any[]): string {
    return `
      <p><strong>Total Tools:</strong> ${tools.length}</p>
      <p><strong>Tools with DPA:</strong> ${tools.filter((t) => t.hasDPA).length}</p>
      <p><strong>Active Policies:</strong> ${policies.filter((p) => p.status === 'ACTIVE').length}</p>
      <p><strong>Regulations Tracked:</strong> ${regulations.length}</p>
    `;
  }

  private static generateGapAnalysisSection(gapAnalysis: any): string {
    return `
      <p><strong>Overall Compliance Score: ${gapAnalysis.overallScore}%</strong></p>
      <h3>Identified Gaps:</h3>
      ${gapAnalysis.gaps.map((gap: any) => `
        <div class="gap-item ${gap.severity.toLowerCase()}">
          <strong>${gap.category}:</strong> ${gap.issue}<br>
          <em>Recommendation:</em> ${gap.recommendation}
        </div>
      `).join('')}
    `;
  }

  private static generateFrameworkComplianceTable(regulations: any[]): string {
    return `
      <table>
        <tr>
          <th>Framework</th>
          <th>Article</th>
          <th>Name</th>
          <th>Controls</th>
          <th>Evidence</th>
        </tr>
        ${regulations.map((reg) => `
          <tr>
            <td>${reg.framework}</td>
            <td>${reg.article || 'N/A'}</td>
            <td>${reg.name}</td>
            <td>${reg.controls.length}</td>
            <td>${reg.controls.reduce((sum: number, cr: any) => sum + cr.control.evidence.length, 0)}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private static generatePolicyComplianceTable(policies: any[]): string {
    return `
      <table>
        <tr>
          <th>Policy Name</th>
          <th>Status</th>
          <th>Controls</th>
          <th>Evidence</th>
        </tr>
        ${policies.map((policy) => `
          <tr>
            <td>${policy.name}</td>
            <td>${policy.status}</td>
            <td>${policy.controls.length}</td>
            <td>${policy.controls.reduce((sum: number, c: any) => sum + c.evidence.length, 0)}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private static generateToolComplianceTable(tools: any[]): string {
    return `
      <table>
        <tr>
          <th>Tool Name</th>
          <th>Has DPA</th>
          <th>Risk Level</th>
          <th>Compliant</th>
        </tr>
        ${tools.map((tool) => `
          <tr>
            <td>${tool.name}</td>
            <td>${tool.hasDPA ? 'Yes' : 'No'}</td>
            <td><span class="badge badge-${tool.riskLevel.toLowerCase()}">${tool.riskLevel}</span></td>
            <td>${tool.hasDPA && (tool.riskLevel === 'Low' || tool.riskLevel === 'Medium') ? 'Yes' : 'No'}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private static generateKeyMetricsSection(tools: any[], risks: any[], policies: any[], incidents: any[]): string {
    return `
      <div class="summary">
        <div class="summary-card">
          <h3>Total Tools</h3>
          <div class="value">${tools.length}</div>
        </div>
        <div class="summary-card">
          <h3>Total Risks</h3>
          <div class="value">${risks.length}</div>
        </div>
        <div class="summary-card">
          <h3>Active Policies</h3>
          <div class="value">${policies.filter((p) => p.status === 'ACTIVE').length}</div>
        </div>
        <div class="summary-card">
          <h3>Open Incidents</h3>
          <div class="value">${incidents.filter((i) => i.status !== 'RESOLVED').length}</div>
        </div>
      </div>
    `;
  }

  private static generateRiskOverviewTable(tools: any[]): string {
    return this.generateToolsTable(tools);
  }

  private static generateComplianceStatusSection(tools: any[], policies: any[]): string {
    return `
      <p><strong>Tools with DPA:</strong> ${tools.filter((t) => t.hasDPA).length} / ${tools.length}</p>
      <p><strong>Active Policies:</strong> ${policies.filter((p) => p.status === 'ACTIVE').length} / ${policies.length}</p>
    `;
  }

  private static generateRecommendationsSection(tools: any[], risks: any[]): string {
    const recommendations: string[] = [];
    
    const highRiskTools = tools.filter((t) => t.riskLevel === 'High' || t.riskLevel === 'Critical');
    if (highRiskTools.length > 0) {
      recommendations.push(`Review ${highRiskTools.length} high/critical risk tools`);
    }

    const toolsWithoutDPA = tools.filter((t) => !t.hasDPA && t.dataTypes.includes('PII'));
    if (toolsWithoutDPA.length > 0) {
      recommendations.push(`Execute DPAs for ${toolsWithoutDPA.length} tools processing PII`);
    }

    const pendingRisks = risks.filter((r) => !r.decisions || r.decisions.length === 0);
    if (pendingRisks.length > 0) {
      recommendations.push(`Make decisions on ${pendingRisks.length} pending risks`);
    }

    return `
      <ul>
        ${recommendations.map((rec) => `<li>${rec}</li>`).join('')}
      </ul>
    `;
  }
}
