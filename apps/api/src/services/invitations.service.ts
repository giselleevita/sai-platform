import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';

export type CreateInvitationInput = {
  email: string;
  role: 'MANAGEMENT' | 'ADMIN' | 'OPERATOR' | 'AUDITOR';
  expiresInDays?: number;
};

export type InvitationRecord = {
  id: string;
  companyId: string;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  invitedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export class InvitationsService {
  static async createInvitation(
    companyId: string,
    actorId: string | undefined,
    input: CreateInvitationInput,
  ): Promise<{ invitation: InvitationRecord; token: string }> {
    const email = normalizeEmail(input.email);
    const expiresInDays = input.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const existingActive = await prisma.invitation.findFirst({
      where: {
        companyId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingActive) {
      throw new Error('An active invitation already exists for this email');
    }

    const token = randomBytes(24).toString('hex');
    const tokenHash = hashToken(token);

    const invitation = await prisma.invitation.create({
      data: {
        companyId,
        email,
        role: input.role,
        tokenHash,
        expiresAt,
        invitedByUserId: actorId,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'invite.create',
      targetType: 'Invitation',
      targetId: invitation.id,
      changes: { email, role: input.role, expiresAt: expiresAt.toISOString() },
    });

    return { invitation, token };
  }

  static async listInvitations(companyId: string): Promise<InvitationRecord[]> {
    return prisma.invitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async revokeInvitation(companyId: string, actorId: string | undefined, id: string): Promise<void> {
    const updated = await prisma.invitation.updateMany({
      where: { id, companyId, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!updated.count) {
      throw new Error('Invitation not found or already finalized');
    }

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'invite.revoke',
      targetType: 'Invitation',
      targetId: id,
    });
  }

  static async acceptInvitationByToken(params: { email: string; token: string }): Promise<{
    companyId: string;
    role: 'MANAGEMENT' | 'ADMIN' | 'OPERATOR' | 'AUDITOR';
    invitationId: string;
    invitedByUserId?: string | null;
  }> {
    const email = normalizeEmail(params.email);
    const tokenHash = hashToken(params.token);

    const invite = await prisma.invitation.findFirst({
      where: {
        email,
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!invite) {
      throw new Error('Invalid or expired invitation');
    }

    await prisma.invitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    await AuditLogService.log({
      companyId: invite.companyId,
      actorId: invite.invitedByUserId || undefined,
      action: 'invite.accept',
      targetType: 'Invitation',
      targetId: invite.id,
      changes: { email },
    });

    return {
      companyId: invite.companyId,
      role: invite.role,
      invitationId: invite.id,
      invitedByUserId: invite.invitedByUserId,
    };
  }
}

export { hashToken };
