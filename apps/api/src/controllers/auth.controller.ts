import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { AuthValidator } from '../validation/auth.validator';
import { BadRequestError, UnauthorizedError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { generateCsrfToken } from '../middleware/csrf';

export class AuthController {
  /**
   * POST /api/auth/signup
   * Create new user and company
   */
  static async signup(req: Request, res: Response) {
    try {
      const { email, password, name, companyName, industry, country } = req.body;

      // Validate input
      AuthValidator.validateSignup({ email, password, name, companyName });

      const result = await AuthService.signup({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        companyName: companyName.trim(),
        industry,
        country,
      });

      // Set tokens in httpOnly cookies
      AuthService.setTokenCookie(res as any, result.token, result.refreshToken, result.refreshTokenExpiresAt);

      // Generate CSRF token
      const csrfToken = generateCsrfToken();
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrf-token', csrfToken, {
        httpOnly: false, // CSRF token must be accessible to JavaScript
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      // Return user data without tokens
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          company: result.company,
          csrfToken, // Return CSRF token in response for frontend to store
        },
      });
    } catch (error) {
      const errorMsg = (error as any).message;
      if (errorMsg.includes('already exists')) {
        throw new BadRequestError(errorMsg);
      }
      logger.error('Error during signup:', error);
      throw error;
    }
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password, mfaCode, recoveryCode } = req.body;

      // Validate input
      AuthValidator.validateLogin({ email, password });

      const result = await AuthService.login({
        email: email.trim().toLowerCase(),
        password,
        mfaCode,
        recoveryCode,
      });

      // Set tokens in httpOnly cookies
      AuthService.setTokenCookie(res as any, result.token, result.refreshToken, result.refreshTokenExpiresAt);

      // Generate CSRF token
      const csrfToken = generateCsrfToken();
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrf-token', csrfToken, {
        httpOnly: false, // CSRF token must be accessible to JavaScript
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      // Return user data without tokens
      res.json({
        success: true,
        data: {
          user: result.user,
          company: result.company,
          csrfToken, // Return CSRF token in response for frontend to store
        },
      });
    } catch (error) {
      const errorMsg = (error as any).message;
      if (errorMsg.includes('Invalid')) {
        throw new UnauthorizedError(errorMsg);
      }
      logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * GET /api/auth/me
   * Get current user
   */
  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await AuthService.getUserById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.json({ success: true, data: user });
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies['refresh-token'];

      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      // Set new tokens in cookies
      AuthService.setTokenCookie(res as any, result.token, result.refreshToken, result.refreshTokenExpiresAt);

      res.json({ success: true, message: 'Token refreshed' });
    } catch (error) {
      logger.error('Error refreshing token:', error);
      AuthService.clearTokenCookies(res);
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * POST /api/auth/logout
   * Revoke refresh token and clear cookies
   */
  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies['refresh-token'];

      if (refreshToken) {
        await AuthService.revokeRefreshToken(refreshToken);
      }

      // Clear all auth cookies
      AuthService.clearTokenCookies(res as any);

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Error during logout:', error);
      // Clear cookies even on error
      AuthService.clearTokenCookies(res);
      throw error;
    }
  }

  /**
   * POST /api/auth/mfa/setup
   * Begins MFA enrollment and returns secret + recovery codes
   */
  static async setupMfa(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const email = req.user?.email;
    if (!userId || !email) {
      throw new UnauthorizedError('User not authenticated');
    }

    const data = await AuthService.initiateMfaSetup(userId, email);
    res.json({ success: true, data });
  }

  /**
   * POST /api/auth/mfa/verify
   * Confirms MFA enrollment with a valid TOTP code
   */
  static async verifyMfa(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { code } = req.body || {};
    if (!code) {
      throw new BadRequestError('MFA code is required');
    }

    const data = await AuthService.verifyMfaSetup(userId, code);
    res.json({ success: true, data });
  }

  /**
   * POST /api/auth/mfa/disable
   * Disables MFA using a TOTP or recovery code
   */
  static async disableMfa(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { code, recoveryCode } = req.body || {};
    const data = await AuthService.disableMfa(userId, code, recoveryCode);
    res.json({ success: true, data });
  }
}
