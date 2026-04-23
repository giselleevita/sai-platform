import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma.client';
import { BadRequestError, ForbiddenError } from '../errors/AppError';

export class IntegrationsSsoController {
  static async getConnection(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const row = await prisma.ssoConnection.findUnique({
      where: { companyId },
      select: { companyId: true, issuer: true, clientId: true, clientSecretRef: true, redirectUri: true, updatedAt: true },
    });
    res.json({ success: true, data: row });
  }

  static async upsertConnection(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can configure SSO.');
    }
    const { issuer, clientId, clientSecretRef, redirectUri } = req.body as Record<string, unknown>;
    if (typeof issuer !== 'string' || typeof clientId !== 'string' || typeof clientSecretRef !== 'string' || typeof redirectUri !== 'string') {
      throw new BadRequestError('issuer, clientId, clientSecretRef, redirectUri are required');
    }
    const row = await prisma.ssoConnection.upsert({
      where: { companyId },
      create: { companyId, issuer: issuer.trim(), clientId: clientId.trim(), clientSecretRef: clientSecretRef.trim(), redirectUri: redirectUri.trim() },
      update: { issuer: issuer.trim(), clientId: clientId.trim(), clientSecretRef: clientSecretRef.trim(), redirectUri: redirectUri.trim() },
      select: { companyId: true, issuer: true, clientId: true, clientSecretRef: true, redirectUri: true, updatedAt: true },
    });
    res.json({ success: true, data: row });
  }

  static async listDomains(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const rows = await prisma.verifiedDomain.findMany({
      where: { companyId },
      orderBy: { domain: 'asc' },
      select: { id: true, domain: true, verifiedAt: true, updatedAt: true },
    });
    res.json({ success: true, data: rows });
  }

  static async upsertDomain(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can manage verified domains.');
    }
    const { domain, verified } = req.body as { domain?: string; verified?: boolean };
    if (!domain) throw new BadRequestError('domain is required');
    const normalized = domain.trim().toLowerCase().replace(/^@/, '');
    const row = await prisma.verifiedDomain.upsert({
      where: { companyId_domain: { companyId, domain: normalized } },
      create: { companyId, domain: normalized, verifiedAt: verified ? new Date() : null },
      update: { verifiedAt: verified ? new Date() : null },
      select: { id: true, domain: true, verifiedAt: true, updatedAt: true },
    });
    res.json({ success: true, data: row });
  }

  static async listGroupRoleMappings(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const rows = await prisma.groupRoleMapping.findMany({
      where: { companyId },
      orderBy: { group: 'asc' },
      select: { id: true, group: true, role: true, updatedAt: true },
    });
    res.json({ success: true, data: rows });
  }

  static async upsertGroupRoleMapping(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    const role = req.user?.role;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (role !== 'MANAGEMENT' && role !== 'ADMIN') {
      throw new ForbiddenError('Only Management or Admin can manage group mappings.');
    }
    const { group, mappedRole } = req.body as { group?: string; mappedRole?: string };
    if (!group || !mappedRole) throw new BadRequestError('group and mappedRole are required');
    const row = await prisma.groupRoleMapping.upsert({
      where: { companyId_group: { companyId, group } },
      create: { companyId, group, role: mappedRole as any },
      update: { role: mappedRole as any },
      select: { id: true, group: true, role: true, updatedAt: true },
    });
    res.json({ success: true, data: row });
  }
}

