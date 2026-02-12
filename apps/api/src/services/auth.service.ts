import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { TOTP, generateSecret, generateURI, verify } from 'otplib';
import { Response } from 'express';
import { prisma } from './prisma.client';
import { config } from '../config';

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
  static async createRefreshToken(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
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

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    const newRefresh = await this.createRefreshToken(stored.userId);

    const accessToken = this.generateToken({
      id: stored.user.id,
      email: stored.user.email,
      companyId: stored.user.company?.id || '',
      role: stored.user.role,
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
    // Temporary workaround: use type assertion to bypass Prisma enum type mismatch
    const existingUser = await (prisma as any).user.findUnique({
      where: { email: input.email },
    }) as any;

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

      return { user, company };
    });

    // Generate token
    const token = this.generateToken({
      id: result.user.id,
      email: result.user.email,
      companyId: result.company.id,
      role: result.user.role,
    });
    const refreshToken = await this.createRefreshToken(result.user.id);

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

    if (!user || !user.company || !user.password) {
      throw new Error('Invalid email or password');
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
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      companyId: user.company.id,
      role: user.role,
    });
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      token,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
   * Get user by ID
   */
  static async getUserById(userId: string) {
    // Temporary workaround: use type assertion to bypass Prisma enum type mismatch
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
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
}
