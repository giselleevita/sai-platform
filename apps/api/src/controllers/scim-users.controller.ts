import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma.client';
import { ScimAuthenticatedRequest } from '../middleware/scimAuth';

function scimUser(id: string, email: string, name: string, active: boolean) {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id,
    userName: email,
    name: { formatted: name },
    active,
  };
}

function randomPassword(): string {
  return crypto.randomBytes(18).toString('base64url');
}

export class ScimUsersController {
  static async list(req: ScimAuthenticatedRequest, res: Response) {
    const companyId = req.scim?.companyId;
    if (!companyId) {
      res.status(401).json({ detail: 'Unauthorized' });
      return;
    }
    const rows = await prisma.userCompanyMembership.findMany({
      where: { companyId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: rows.length,
      Resources: rows.map((m) => scimUser(m.userId, m.user.email, m.user.name, m.status === 'ACTIVE' && !m.user.disabledAt)),
    });
  }

  static async get(req: ScimAuthenticatedRequest, res: Response) {
    const companyId = req.scim?.companyId;
    if (!companyId) {
      res.status(401).json({ detail: 'Unauthorized' });
      return;
    }
    const id = req.params.id;
    const membership = await prisma.userCompanyMembership.findUnique({
      where: { userId_companyId: { userId: id, companyId } },
      include: { user: true },
    });
    if (!membership) {
      res.status(404).json({ detail: 'Not found' });
      return;
    }
    res.json(scimUser(membership.userId, membership.user.email, membership.user.name, membership.status === 'ACTIVE' && !membership.user.disabledAt));
  }

  static async create(req: ScimAuthenticatedRequest, res: Response) {
    const companyId = req.scim?.companyId;
    if (!companyId) {
      res.status(401).json({ detail: 'Unauthorized' });
      return;
    }

    const body = req.body as any;
    const email = (body?.userName as string | undefined)?.trim().toLowerCase();
    const name = (body?.name?.formatted as string | undefined)?.trim() || email?.split('@')[0] || 'User';
    const active = body?.active !== false;

    if (!email || !email.includes('@')) {
      res.status(400).json({ detail: 'userName must be a valid email' });
      return;
    }

    const out = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        // Create local-password user with random password; user can reset later.
        const hashed = await bcrypt.hash(randomPassword(), 10);
        user = await tx.user.create({
          data: {
            email,
            name,
            password: hashed || null,
            companyId,
            role: 'OPERATOR',
            disabledAt: active ? null : new Date(),
          },
        });
      }

      const membership = await tx.userCompanyMembership.upsert({
        where: { userId_companyId: { userId: user.id, companyId } },
        create: { userId: user.id, companyId, role: user.role, status: active ? 'ACTIVE' : 'DISABLED' },
        update: { status: active ? 'ACTIVE' : 'DISABLED' },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          actorId: null,
          action: 'SCIM_USER_CREATE',
          targetType: 'User',
          targetId: user.id,
          changes: { email, name, active, membershipStatus: membership.status } as any,
        },
      });
      return { user, membership };
    });

    res.status(201).json(scimUser(out.user.id, out.user.email, out.user.name, out.membership.status === 'ACTIVE' && !out.user.disabledAt));
  }

  static async patch(req: ScimAuthenticatedRequest, res: Response) {
    const companyId = req.scim?.companyId;
    if (!companyId) {
      res.status(401).json({ detail: 'Unauthorized' });
      return;
    }
    const userId = req.params.id;
    const body = req.body as any;
    const active = body?.active;
    const name = body?.name?.formatted;

    const out = await prisma.$transaction(async (tx) => {
      const membership = await tx.userCompanyMembership.findUnique({
        where: { userId_companyId: { userId, companyId } },
        include: { user: true },
      });
      if (!membership) return null;

      if (typeof name === 'string' && name.trim()) {
        await tx.user.update({ where: { id: userId }, data: { name: name.trim() } });
      }
      if (typeof active === 'boolean') {
        await tx.userCompanyMembership.update({
          where: { userId_companyId: { userId, companyId } },
          data: { status: active ? 'ACTIVE' : 'DISABLED' },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId,
          actorId: null,
          action: 'SCIM_USER_PATCH',
          targetType: 'User',
          targetId: userId,
          changes: { active, name } as any,
        },
      });

      const refreshed = await tx.userCompanyMembership.findUnique({
        where: { userId_companyId: { userId, companyId } },
        include: { user: true },
      });
      return refreshed;
    });

    if (!out) {
      res.status(404).json({ detail: 'Not found' });
      return;
    }
    res.json(scimUser(out.userId, out.user.email, out.user.name, out.status === 'ACTIVE' && !out.user.disabledAt));
  }

  static async delete(req: ScimAuthenticatedRequest, res: Response) {
    const companyId = req.scim?.companyId;
    if (!companyId) {
      res.status(401).json({ detail: 'Unauthorized' });
      return;
    }
    const userId = req.params.id;

    await prisma.$transaction(async (tx) => {
      const membership = await tx.userCompanyMembership.findUnique({
        where: { userId_companyId: { userId, companyId } },
      });
      if (!membership) return;
      await tx.userCompanyMembership.update({
        where: { userId_companyId: { userId, companyId } },
        data: { status: 'DISABLED' },
      });
      await tx.auditLog.create({
        data: {
          companyId,
          actorId: null,
          action: 'SCIM_USER_DELETE',
          targetType: 'User',
          targetId: userId,
          changes: { membershipStatus: 'DISABLED' } as any,
        },
      });
    });

    res.status(204).send();
  }
}

