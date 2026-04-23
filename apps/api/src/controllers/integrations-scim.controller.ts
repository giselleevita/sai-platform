import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { BadRequestError, ForbiddenError } from '../errors/AppError';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class IntegrationsScimController {
  static async listTokens(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const rows = await prisma.scimToken.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    });
    res.json({ success: true, data: rows });
  }

  static async createToken(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can create SCIM tokens.');
    }
    const name = (req.body?.name as string | undefined)?.trim() || 'SCIM token';
    if (!name) throw new BadRequestError('name is required');
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const row = await prisma.scimToken.create({
      data: { companyId, name, tokenHash },
      select: { id: true, name: true, createdAt: true },
    });
    // Return plaintext token once.
    res.status(201).json({ success: true, data: { ...row, token } });
  }

  static async revokeToken(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can revoke SCIM tokens.');
    }
    const tokenId = req.params.id;
    await prisma.scimToken.updateMany({
      where: { id: tokenId, companyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.json({ success: true });
  }
}

