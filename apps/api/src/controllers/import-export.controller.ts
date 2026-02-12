import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ImportExportService } from '../services/import-export.service';
import { BadRequestError } from '../errors/AppError';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv', // .csv
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx and .csv files are allowed.'));
    }
  },
});

export class ImportExportController {
  /**
   * GET /api/export/tools/excel
   * Export tools to Excel
   */
  static async exportToolsExcel(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const buffer = await ImportExportService.exportToolsToExcel(companyId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tools-export-${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    res.send(buffer);
  }

  /**
   * GET /api/export/risks/excel
   * Export risks to Excel
   */
  static async exportRisksExcel(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const buffer = await ImportExportService.exportRisksToExcel(companyId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="risks-export-${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    res.send(buffer);
  }

  /**
   * POST /api/import/tools
   * Import tools from Excel/CSV
   */
  static async importTools(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId || !actorId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    upload.single('file')(req as any, res as any, async (err: any) => {
      if (err) {
        throw new BadRequestError(err.message);
      }

      const file = (req as any).file;
      if (!file) {
        throw new BadRequestError('File is required');
      }

      const result = await ImportExportService.importToolsFromFile(
        companyId,
        actorId,
        file.buffer,
        file.originalname
      );

      res.json({ success: true, data: result });
    });
  }

  /**
   * POST /api/import/risks
   * Import risks from Excel/CSV
   */
  static async importRisks(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    if (!companyId || !actorId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    upload.single('file')(req as any, res as any, async (err: any) => {
      if (err) {
        throw new BadRequestError(err.message);
      }

      const file = (req as any).file;
      if (!file) {
        throw new BadRequestError('File is required');
      }

      const result = await ImportExportService.importRisksFromFile(
        companyId,
        actorId,
        file.buffer,
        file.originalname
      );

      res.json({ success: true, data: result });
    });
  }
}
