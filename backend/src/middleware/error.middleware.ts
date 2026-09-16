import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface CustomError {
  status?: number;
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown;
}

export function errorHandler(
  err: CustomError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const status = (err as CustomError).status || (err as CustomError).statusCode || 500;
  const code = (err as CustomError).code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR');
  let message = err.message || 'An unexpected server error occurred.';
  if (message.includes('postgres://') || message.includes('postgresql://')) {
    message = 'Database communication error.';
  }

  if (status >= 500) {
    logger.error(`Error on ${req.method} ${req.originalUrl}: [${code}] ${message}`, (err as CustomError).details);
  } else {
    logger.warn(`Client rejection on ${req.method} ${req.originalUrl} (${status}): [${code}] ${message}`);
  }

  res.status(status).json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  });
}
