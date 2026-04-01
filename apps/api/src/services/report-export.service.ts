import { prisma } from './prisma.client';

export interface ComplianceExportResult {
  generatedAt: string;
  companyId: string;
  mimeType: 'application/pdf';
  filename: string;
  base64Payload: string;
}

export class ReportExportService {
  static async exportCompliancePdf(companyId: string): Promise<ComplianceExportResult> {
    const [tools, policies, regulations] = await Promise.all([
      prisma.aITool.count({ where: { companyId } }),
      prisma.policy.count({ where: { companyId } }),
      prisma.regulation.count({ where: { companyId } }),
    ]);

    const generatedAt = new Date().toISOString();
    const content = [
      'SAI Compliance Export',
      `companyId: ${companyId}`,
      `generatedAt: ${generatedAt}`,
      `toolCount: ${tools}`,
      `policyCount: ${policies}`,
      `regulationCount: ${regulations}`,
    ].join('\n');

    return {
      generatedAt,
      companyId,
      mimeType: 'application/pdf',
      filename: `compliance-export-${generatedAt.slice(0, 10)}.pdf`,
      base64Payload: Buffer.from(content, 'utf-8').toString('base64'),
    };
  }
}
