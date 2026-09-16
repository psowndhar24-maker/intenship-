import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token missing or invalid format. Header format must be Bearer <token> or ?token=<token>.'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID_OR_EXPIRED',
        message: 'Session token has expired or signature verification failed.'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.user = payload;
  next();
}

export function authorizeRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before checking role authorization.'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Route requires one of [${allowedRoles.join(', ')}], but current role is '${req.user.role}'.`
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}
