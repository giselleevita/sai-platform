import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    companyId: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from cookie first (preferred), then from Authorization header (backward compatibility)
    let token = req.cookies['access-token'];
    
    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token',
      });
      return;
    }

    let payload = AuthService.verifyToken(token);
    
    if (!payload) {
      // Try to refresh token if we have a refresh token cookie
      const refreshToken = req.cookies['refresh-token'];
      if (refreshToken) {
        try {
          const result = await AuthService.refreshAccessToken(refreshToken);
          AuthService.setTokenCookie(res as any, result.token, result.refreshToken, result.refreshTokenExpiresAt);
          payload = AuthService.verifyToken(result.token);
        } catch (refreshError) {
          AuthService.clearTokenCookies(res as any);
          res.status(401).json({
            success: false,
            error: 'Unauthorized: Session expired. Please login again.',
          });
          return;
        }
      } else {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or expired token',
        });
        return;
      }
    }

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired token',
      });
      return;
    }

    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Token verification failed',
    });
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = AuthService.verifyToken(token);
      if (payload) {
        (req as AuthenticatedRequest).user = payload;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
      return;
    }

    next();
  };
};
