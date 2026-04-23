import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';

export class EntitlementsController {
  static async getPlanAndUsage(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const [subscription, entitlements, toolCount] = await Promise.all([
      prisma.companySubscription.findUnique({ where: { companyId } }),
      prisma.companyEntitlement.findMany({ where: { companyId }, select: { key: true, valueInt: true, valueBool: true } }),
      prisma.aITool.count({ where: { companyId, deletedAt: null } }),
    ]);

    res.json({
      success: true,
      data: {
        subscription,
        entitlements,
        usage: {
          aiTools: toolCount,
        },
      },
    });
  }
}

