import { Router } from 'express';
import { AuthController } from '../controllers';
import { authMiddleware, authRateLimiter } from '../middleware';
import { asyncHandler } from '../utils';
import { validate } from '../middleware/validation';
import { loginSchema, signupSchema } from '../validation/schemas';

const router = Router();

/**
 * GET /api/auth/oidc/login
 * Start enterprise SSO (OpenID Connect). Redirects to the identity provider.
 */
router.get('/oidc/login', authRateLimiter, asyncHandler(AuthController.oidcLogin));

/**
 * GET /api/auth/oidc/callback
 * OAuth/OIDC redirect URI — sets session cookies and redirects to the web app.
 */
router.get('/oidc/callback', authRateLimiter, asyncHandler(AuthController.oidcCallback));

/**
 * POST /api/auth/signup
 * Create new user and company
 */
router.post('/signup', authRateLimiter, validate({ body: signupSchema }), asyncHandler(AuthController.signup));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authRateLimiter, validate({ body: loginSchema }), asyncHandler(AuthController.login));

/**
 * GET /api/auth/me
 * Get current user (requires auth)
 */
router.get('/me', authMiddleware, asyncHandler(AuthController.getMe));

/**
 * POST /api/auth/mfa/setup
 * Starts MFA enrollment (requires auth)
 */
router.post('/mfa/setup', authMiddleware, asyncHandler(AuthController.setupMfa));

/**
 * POST /api/auth/mfa/verify
 * Confirms MFA enrollment (requires auth)
 */
router.post('/mfa/verify', authMiddleware, asyncHandler(AuthController.verifyMfa));

/**
 * POST /api/auth/mfa/disable
 * Disables MFA (requires auth)
 */
router.post('/mfa/disable', authMiddleware, asyncHandler(AuthController.disableMfa));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(AuthController.refresh));

/**
 * POST /api/auth/logout
 * Revoke refresh token
 */
router.post('/logout', asyncHandler(AuthController.logout));

export default router;
