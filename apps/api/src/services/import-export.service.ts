import * as XLSX from 'xlsx';
import { prisma } from './prisma.client';
import { AIToolService } from './ai-tool.service';
import { RiskService } from './risk.service';

export class ImportExportService {
  /**
   * Export tools to Excel
   */
  static async exportToolsToExcel(companyId: string): Promise<Buffer> {
    const result = await AIToolService.getToolsByCompany(companyId, {
      pagination: { limit: 10000 },
    });
    const tools = result.data;

    // Prepare data
    const data = tools.map((tool) => ({
      Name: tool.name,
      Category: tool.category,
      Vendor: tool.vendor || '',
      Description: tool.description || '',
      'Data Types': tool.dataTypes.join(', '),
      Users: tool.users,
      Frequency: tool.frequency,
      'Risk Score': tool.riskScore,
      'Risk Level': tool.riskLevel,
      'Has DPA': tool.hasDPA ? 'Yes' : 'No',
      'Data Residency': tool.dataResidency || '',
      'Created At': tool.createdAt.toISOString(),
      'Updated At': tool.updatedAt.toISOString(),
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Tools');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Export risks to Excel
   */
  static async exportRisksToExcel(companyId: string): Promise<Buffer> {
    const result = await RiskService.list(companyId, {
      pagination: { limit: 10000 },
    });
    const risks = result.data;

    // Prepare data
    const data = risks.map((risk: any) => ({
      Title: risk.title,
      Description: risk.description || '',
      Category: risk.category,
      Likelihood: risk.likelihood,
      Impact: risk.impact,
      'Risk Score': risk.likelihood * risk.impact,
      'Created At': risk.createdAt.toISOString(),
      'Updated At': risk.updatedAt.toISOString(),
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Risks');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Import tools from Excel/CSV
   */
  static async importToolsFromFile(
    companyId: string,
    actorId: string,
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data as any[]) {
      try {
        await AIToolService.createTool(companyId, {
          name: row.Name || row.name,
          category: row.Category || row.category || 'Other',
          vendor: row.Vendor || row.vendor,
          description: row.Description || row.description,
          dataTypes: (row['Data Types'] || row.dataTypes || 'Public')
            .split(',')
            .map((s: string) => s.trim()),
          users: parseInt(row.Users || row.users || '0', 10),
          frequency: row.Frequency || row.frequency || 'Rarely',
          controls: [],
          hasDPA: row['Has DPA'] === 'Yes' || row.hasDPA === true,
          dataResidency: row['Data Residency'] || row.dataResidency,
        });
        imported++;
      } catch (error: any) {
        failed++;
        errors.push(`Row ${row.__rowNum__ || 'unknown'}: ${error.message}`);
      }
    }

    return { imported, failed, errors };
  }

  /**
   * Import risks from Excel/CSV
   */
  static async importRisksFromFile(
    companyId: string,
    actorId: string,
    fileBuffer: Buffer
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data as any[]) {
      try {
        await RiskService.create(companyId, actorId, {
          title: row.Title || row.title,
          description: row.Description || row.description,
          likelihood: parseInt(row.Likelihood || row.likelihood || '3', 10),
          impact: parseInt(row.Impact || row.impact || '3', 10),
          category: row.Category || row.category || 'Operational',
        });
        imported++;
      } catch (error: any) {
        failed++;
        errors.push(`Row ${row.__rowNum__ || 'unknown'}: ${error.message}`);
      }
    }

    return { imported, failed, errors };
  }
}
