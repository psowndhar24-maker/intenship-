import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  public static login = (req: Request, res: Response, next: NextFunction): void => {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // keep as string
        }
      }

      const { username, password, role } = body || {};
      logger.info('Authentication attempt received', { username, role });

      const authResult = AuthService.authenticate({ username, password, role });
      logger.info('Authentication successful', { username, role: authResult.user.role, userId: authResult.user.id });

      res.status(200).json(authResult);
    } catch (error) {
      next(error);
    }
  };
}
