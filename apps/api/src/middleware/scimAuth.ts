import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/prisma.client';

export interface ScimAuthenticatedRequest extends Request {
  scim?: { companyId: string; tokenId: string };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function scimAuthMiddleware(
  req: ScimAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ detail: 'Missing Bearer token' });
    return;
  }

  const tokenHash = hashToken(token);
  const row = await prisma.scimToken.findUnique({
    where: { tokenHash },
    select: { id: true, companyId: true, revokedAt: true },
  });
  if (!row || row.revokedAt) {
    res.status(401).json({ detail: 'Invalid token' });
    return;
  }

  await prisma.scimToken.update({
    where: { id: row.id },
    data: { lastUsedAt: new Date() },
  });

  req.scim = { companyId: row.companyId, tokenId: row.id };
  next();
}

