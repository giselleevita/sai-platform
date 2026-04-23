import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { TOTP, generateSecret, generateURI, verify } from 'otplib';
import { Response } from 'express';
import { prisma } from './prisma.client';
import { config } from '../config';
import type { UserRole } from '@prisma/client';

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || '30');
const MFA_ISSUER = process.env.MFA_ISSUER || config.mfa.issuer || 'SAI Platform';
const MFA_WINDOW = Number(process.env.MFA_WINDOW || config.mfa.window || 1);

export interface TokenPayload {
  id: string;
  email: string;
  companyId: string;
  role: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry?: string;
  country?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
  recoveryCode?: string;
}

export class AuthService {
  private static async resolveRoleForCompany(params: {
    userId: string;
    companyId: string;
    fallbackRole: string;
  }): Promise<string> {
    const membership = await prisma.userCompanyMembership.findUnique({
      where: { userId_companyId: { userId: params.userId, companyId: params.companyId } },
      select: { role: true, status: true },
    });
    if (membership && membership.status === 'ACTIVE') return membership.role;
    return params.fallbackRole;
  }

  /**
   * Generate JWT token for user
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Set httpOnly cookie with token
   */
  static setTokenCookie(res: Response, token: string, refreshToken: string, refreshExpiresAt: Date) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token cookie (short-lived)
    res.cookie('access-token', token, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Refresh token cookie (long-lived)
    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      expires: refreshExpiresAt,
      path: '/',
    });
  }

  /**
   * Clear auth cookies
   */
  static clearTokenCookies(res: Response) {
    res.clearCookie('access-token', { path: '/' });
    res.clearCookie('refresh-token', { path: '/' });
    res.clearCookie('csrf-token', { path: '/' });
  }

  /**
   * Create refresh token and persist it
   */
  static async createRefreshToken(userId: string, companyId?: string | null) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        companyId: companyId ?? null,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  /**
   * Rotate refresh token and issue new access token
   */
  static async refreshAccessToken(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { company: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const activeCompanyId = stored.companyId || stored.user.company?.id || '';
    if (!activeCompanyId) {
      throw new Error('Refresh token missing company context');
    }

    const membership = await prisma.userCompanyMembership.findUnique({
      where: { userId_companyId: { userId: stored.userId, companyId: activeCompanyId } },
      select: { status: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new Error('Membership is not active for this company');
    }

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    const newRefresh = await this.createRefreshToken(stored.userId, activeCompanyId);

    const role = activeCompanyId
      ? await this.resolveRoleForCompany({
          userId: stored.user.id,
          companyId: activeCompanyId,
          fallbackRole: stored.user.role,
        })
      : stored.user.role;

    const accessToken = this.generateToken({
      id: stored.user.id,
      email: stored.user.email,
      companyId: activeCompanyId,
      role,
    });

    return {
      token: accessToken,
      refreshToken: newRefresh.token,
      refreshTokenExpiresAt: newRefresh.expiresAt,
    };
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private static hashRecoveryCode(code: string) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private static generateRecoveryCodes(count = 8) {
    const codes: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const code = crypto.randomBytes(5).toString('hex'); // 10 hex chars
      codes.push(code);
    }
    const hashedCodes = codes.map((code) => this.hashRecoveryCode(code));
    return { codes, hashedCodes };
  }

  private static verifyRecoveryCode(inputCode: string, storedHashedCodes: string[]) {
    const hashed = this.hashRecoveryCode(inputCode);
    const remaining = storedHashedCodes.filter((code) => code !== hashed);
    const matched = remaining.length !== storedHashedCodes.length;
    return { matched, remaining };
  }

  /**
   * Sign up new user and company
   */
  static async signup(input: SignupInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email: input.email },
    });

    if (existingCompany) {
      throw new Error('Company with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(input.password);

    // Create company and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: input.companyName,
          email: input.email,
          industry: input.industry,
          country: input.country,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
          companyId: company.id,
          role: 'MANAGEMENT',
        },
      });

      await tx.userCompanyMembership.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: user.role,
        },
      });

      return { user, company };
    });

    // Generate token
    const token = this.generateToken({
      id: result.user.id,
      email: result.user.email,
      companyId: result.company.id,
      role: result.user.role,
    });
    const refreshToken = await this.createRefreshToken(result.user.id, result.company.id);

    return {
      token,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        email: result.company.email,
      },
    };
  }

  /**
   * Login user
   */
  static async login(input: LoginInput) {
    // Find user with company
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { company: true },
    });

    if (!user || !user.company) {
      throw new Error('Invalid email or password');
    }

    if ((user as any).disabledAt) {
      throw new Error('Account is disabled');
    }

    if (!user.password) {
      throw new Error('This account uses SSO. Sign in with your organization login.');
    }

    const isValid = await this.comparePassword(input.password, user.password);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Enforce MFA if enabled
    if (user.mfaEnabled) {
      const hasValidTotp =
        !!input.mfaCode &&
        !!user.mfaSecret &&
        await verify({ token: input.mfaCode, secret: user.mfaSecret });

      let recovered = false;
      if (!hasValidTotp && input.recoveryCode) {
        const { matched, remaining } = this.verifyRecoveryCode(input.recoveryCode, user.mfaRecoveryCodes || []);
        if (matched) {
          recovered = true;
          await prisma.user.update({
            where: { id: user.id },
            data: { mfaRecoveryCodes: remaining },
          });
        }
      }

      if (!hasValidTotp && !recovered) {
        throw new Error('MFA code required or invalid');
      }
    }

    // Generate token
    const role = await this.resolveRoleForCompany({
      userId: user.id,
      companyId: user.company.id,
      fallbackRole: user.role,
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      companyId: user.company.id,
      role,
    });
    const refreshToken = await this.createRefreshToken(user.id, user.company.id);

    return {
      token,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        mfaEnabled: user.mfaEnabled,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        email: user.company.email,
      },
    };
  }

  static async initiateMfaSetup(userId: string, email: string) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: email, issuer: MFA_ISSUER });
    const { codes, hashedCodes } = this.generateRecoveryCodes();

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaEnabled: false,
        mfaRecoveryCodes: hashedCodes,
      },
    });

    return {
      secret,
      otpauthUrl,
      recoveryCodes: codes,
    };
  }

  static async verifyMfaSetup(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!user?.mfaSecret) {
      throw new Error('MFA setup was not started');
    }

    const valid = await verify({ token: code, secret: user.mfaSecret });
    if (!valid) {
      throw new Error('Invalid MFA code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { enabled: true };
  }

  static async disableMfa(userId: string, code?: string, recoveryCode?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true, mfaRecoveryCodes: true },
    });

    if (!user?.mfaEnabled) {
      throw new Error('MFA is not enabled');
    }

    const hasValidTotp =
      !!code &&
      !!user.mfaSecret &&
      await verify({ token: code, secret: user.mfaSecret });

    let recovered = false;
    if (!hasValidTotp && recoveryCode) {
      const { matched, remaining } = this.verifyRecoveryCode(recoveryCode, user.mfaRecoveryCodes || []);
      if (matched) {
        recovered = true;
        await prisma.user.update({
          where: { id: userId },
          data: { mfaRecoveryCodes: remaining },
        });
      }
    }

    if (!hasValidTotp && !recovered) {
      throw new Error('Valid MFA or recovery code required to disable MFA');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaRecoveryCodes: [] },
    });

    return { disabled: true };
  }

  /**
   * Issue access + refresh tokens after successful authentication (password or OIDC).
   */
  static async issueSessionForUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    mfaEnabled: boolean;
    disabledAt?: Date | null;
    company: { id: string; name: string; email: string };
  }) {
    if (user.disabledAt) {
      throw new Error('Account is disabled');
    }
    const role = await this.resolveRoleForCompany({
      userId: user.id,
      companyId: user.company.id,
      fallbackRole: user.role,
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      companyId: user.company.id,
      role,
    });
    const refreshToken = await this.createRefreshToken(user.id, user.company.id);

    return {
      token,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        mfaEnabled: user.mfaEnabled,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        email: user.company.email,
      },
    };
  }

  /**
   * Complete OpenID Connect login: link or create user, then issue session.
   */
  static async completeOidcLogin(params: {
    issuerUrl: string;
    subject: string;
    email: string;
    name: string;
    companyId?: string;
    groups?: string[];
    inviteToken?: string;
  }) {
    const provider = `oidc:${params.issuerUrl}`;
    const email = params.email.trim().toLowerCase();

    const targetCompanyId = params.companyId;
    if (targetCompanyId) {
      const domain = email.split('@')[1]?.toLowerCase() || '';
      const verified = await prisma.verifiedDomain.findUnique({
        where: { companyId_domain: { companyId: targetCompanyId, domain } },
        select: { verifiedAt: true },
      });
      if (!verified?.verifiedAt) {
        throw new Error('Email domain is not verified for this company');
      }
    } else {
      const domainRule = config.oidc.allowedEmailDomain;
      if (domainRule) {
        const suffix = domainRule.startsWith('@') ? domainRule : `@${domainRule}`;
        if (!email.endsWith(suffix.toLowerCase())) {
          throw new Error(`Email must use the allowed domain ${suffix}`);
        }
      }
    }

    const computeRoleFromGroups = async (companyId: string, fallback: string): Promise<UserRole> => {
      const groups = params.groups?.filter(Boolean) ?? [];
      if (!groups.length) return fallback as UserRole;
      const mappings = await prisma.groupRoleMapping.findMany({
        where: { companyId, group: { in: groups } },
        select: { role: true },
      });
      const roles = new Set(mappings.map((m) => m.role));
      const order = ['MANAGEMENT', 'ADMIN', 'AUDITOR', 'OPERATOR'];
      for (const r of order) {
        if (roles.has(r as any)) return r as UserRole;
      }
      return fallback as UserRole;
    };

    const ensureMembership = async (userId: string, companyId: string, baseRole: string) => {
      const role = await computeRoleFromGroups(companyId, baseRole);
      await prisma.userCompanyMembership.upsert({
        where: { userId_companyId: { userId, companyId } },
        create: { userId, companyId, role },
        update: { role, status: 'ACTIVE' },
      });
      await prisma.user.update({ where: { id: userId }, data: { companyId } });
      return role;
    };

    const linked = await prisma.oAuthAccount.findUnique({
      where: {
        provider_subject: {
          provider,
          subject: params.subject,
        },
      },
      include: {
        user: { include: { company: true } },
      },
    });

    if (linked?.user) {
      if (targetCompanyId) {
        const role = await ensureMembership(linked.user.id, targetCompanyId, linked.user.role);
        const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
        if (!company) throw new Error('Company not found');
        return this.issueSessionForUser({
          id: linked.user.id,
          email: linked.user.email,
          name: linked.user.name,
          role,
          mfaEnabled: linked.user.mfaEnabled,
          disabledAt: (linked.user as any).disabledAt ?? null,
          company: { id: company.id, name: company.name, email: company.email },
        });
      }
      if (linked.user.company) {
        return this.issueSessionForUser({
          id: linked.user.id,
          email: linked.user.email,
          name: linked.user.name,
          role: linked.user.role,
          mfaEnabled: linked.user.mfaEnabled,
          disabledAt: (linked.user as any).disabledAt ?? null,
          company: linked.user.company,
        });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (existingUser) {
      if ((existingUser as any).disabledAt) {
        throw new Error('Account is disabled');
      }
      await prisma.oAuthAccount.create({
        data: { provider, subject: params.subject, userId: existingUser.id },
      });

      const chosenCompanyId = targetCompanyId ?? existingUser.companyId ?? existingUser.company?.id;
      if (!chosenCompanyId) {
        throw new Error('No company selected for this account');
      }
      const role = await ensureMembership(existingUser.id, chosenCompanyId, existingUser.role);
      const company = await prisma.company.findUnique({ where: { id: chosenCompanyId } });
      if (!company) throw new Error('Company not found');
      return this.issueSessionForUser({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role,
        mfaEnabled: existingUser.mfaEnabled,
        disabledAt: (existingUser as any).disabledAt ?? null,
        company: { id: company.id, name: company.name, email: company.email },
      });
    }

    if (!config.oidc.jitProvisioning) {
      if (!params.inviteToken) {
        throw new Error('No account found for this email. Ask an admin to invite you.');
      }
      const { InvitationsService } = await import('./invitations.service');
      const accepted = await InvitationsService.acceptInvitationByToken({
        email,
        token: params.inviteToken,
      });

      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            name: params.name,
            password: null,
            companyId: accepted.companyId,
            role: accepted.role,
          },
        });
        await tx.userCompanyMembership.create({
          data: { userId: user.id, companyId: accepted.companyId, role: user.role },
        });
        await tx.oAuthAccount.create({
          data: {
            provider,
            subject: params.subject,
            userId: user.id,
          },
        });
        const company = await tx.company.findUnique({ where: { id: accepted.companyId } });
        return { user, company };
      });

      if (!created.company) {
        throw new Error('Company not found');
      }

      return this.issueSessionForUser({
        id: created.user.id,
        email: created.user.email,
        name: created.user.name,
        role: created.user.role,
        mfaEnabled: created.user.mfaEnabled,
        disabledAt: (created.user as any).disabledAt ?? null,
        company: created.company,
      });
    }

    const companyEmail = email;
    const companyName = `${email.split('@')[1] ?? 'organization'} (SSO)`;

    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: params.name,
          password: null,
          companyId: company.id,
          role: 'MANAGEMENT',
        },
      });
      await tx.userCompanyMembership.create({
        data: { userId: user.id, companyId: company.id, role: user.role },
      });

      await tx.oAuthAccount.create({
        data: {
          provider,
          subject: params.subject,
          userId: user.id,
        },
      });

      return { user, company };
    });

    return this.issueSessionForUser({
      id: created.user.id,
      email: created.user.email,
      name: created.user.name,
      role: created.user.role,
      mfaEnabled: created.user.mfaEnabled,
      company: created.company,
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        disabledAt: true,
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            industry: true,
            country: true,
          },
        },
      },
    });

    return user;
  }

  static async listCompaniesForUser(userId: string) {
    const rows = await prisma.userCompanyMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { company: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      companyId: r.company.id,
      companyName: r.company.name,
      companyEmail: r.company.email,
      role: r.role,
    }));
  }

  static async switchCompany(params: { userId: string; companyId: string }) {
    const membership = await prisma.userCompanyMembership.findUnique({
      where: { userId_companyId: { userId: params.userId, companyId: params.companyId } },
      include: { company: true, user: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new Error('Not a member of that company');
    }

    // Keep legacy semantics: active tenant stored on User.companyId
    await prisma.user.update({
      where: { id: params.userId },
      data: { companyId: membership.companyId },
    });

    return this.issueSessionForUser({
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      role: membership.role,
      mfaEnabled: membership.user.mfaEnabled,
      disabledAt: membership.user.disabledAt,
      company: { id: membership.company.id, name: membership.company.name, email: membership.company.email },
    });
  }
}
