import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import { AIToolService } from './ai-tool.service';
import { RiskService } from './risk.service';

type ImportRow = Record<string, string>;

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value !== null) {
    if ('text' in (value as any) && typeof (value as any).text === 'string') {
      return (value as any).text;
    }
    if ('richText' in (value as any) && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((part: any) => part?.text || '').join('');
    }
  }
  return String(value).trim();
}

function parseBool(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

function parseRowsFromWorksheet(worksheet: ExcelJS.Worksheet): ImportRow[] {
  const rows: ImportRow[] = [];
  let headers: string[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rawCells = Array.isArray(row.values) ? row.values.slice(1) : [];

    if (rowNumber === 1) {
      headers = rawCells.map((cell) => normalizeCellValue(cell));
      return;
    }

    const record: ImportRow = {};
    rawCells.forEach((cell, index) => {
      const header = headers[index];
      if (!header) return;
      record[header] = normalizeCellValue(cell);
    });
    rows.push(record);
  });

  return rows;
}

async function parseRowsFromBuffer(fileBuffer: Buffer, filename: string): Promise<ImportRow[]> {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    const content = fileBuffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as Record<string, unknown>[];

    return records.map((record) => {
      const row: ImportRow = {};
      for (const [key, value] of Object.entries(record)) {
        row[key] = normalizeCellValue(value);
      }
      return row;
    });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  return parseRowsFromWorksheet(worksheet);
}

async function buildWorkbookBuffer(
  sheetName: string,
  headers: string[],
  rows: Array<Record<string, string | number>>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = headers.map((header) => ({ header, key: header, width: 24 }));
  rows.forEach((row) => worksheet.addRow(row));

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

export class ImportExportService {
  /**
   * Export tools to Excel
   */
  static async exportToolsToExcel(companyId: string): Promise<Buffer> {
    const result = await AIToolService.getToolsByCompany(companyId, {
      pagination: { limit: 10000 },
    });
    const tools = result.data;

    const rows = tools.map((tool) => ({
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

    return buildWorkbookBuffer(
      'AI Tools',
      [
        'Name',
        'Category',
        'Vendor',
        'Description',
        'Data Types',
        'Users',
        'Frequency',
        'Risk Score',
        'Risk Level',
        'Has DPA',
        'Data Residency',
        'Created At',
        'Updated At',
      ],
      rows
    );
  }

  /**
   * Export risks to Excel
   */
  static async exportRisksToExcel(companyId: string): Promise<Buffer> {
    const result = await RiskService.list(companyId, {
      pagination: { limit: 10000 },
    });
    const risks = result.data;

    const rows = risks.map((risk: any) => ({
      Title: risk.title,
      Description: risk.description || '',
      Category: risk.category || '',
      Likelihood: risk.likelihood,
      Impact: risk.impact,
      'Risk Score': risk.likelihood * risk.impact,
      'Created At': risk.createdAt.toISOString(),
      'Updated At': risk.updatedAt.toISOString(),
    }));

    return buildWorkbookBuffer(
      'Risks',
      ['Title', 'Description', 'Category', 'Likelihood', 'Impact', 'Risk Score', 'Created At', 'Updated At'],
      rows
    );
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
    const rows = await parseRowsFromBuffer(fileBuffer, filename);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const dataTypes = (row['Data Types'] || row.dataTypes || 'Public')
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean);

        await AIToolService.createTool(companyId, {
          name: row.Name || row.name,
          category: row.Category || row.category || 'Other',
          vendor: row.Vendor || row.vendor,
          description: row.Description || row.description,
          dataTypes,
          users: parseInt(row.Users || row.users || '0', 10),
          frequency: row.Frequency || row.frequency || 'Rarely',
          controls: [],
          hasDPA: parseBool(row['Has DPA'] || row.hasDPA || 'false'),
          dataResidency: row['Data Residency'] || row.dataResidency,
        });
        imported++;
      } catch (error: any) {
        failed++;
        errors.push(`Row ${index + 2}: ${error.message}`);
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
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const rows = await parseRowsFromBuffer(fileBuffer, filename);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
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
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    return { imported, failed, errors };
  }
}
