import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';

export class EvidenceReviewController {
  static async myQueue(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!companyId || !userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const rows = await prisma.evidence.findMany({
      where: { companyId, assignedReviewerId: userId, status: 'SUBMITTED' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        controlId: true,
        source: true,
        status: true,
        reference: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: rows });
  }
}

