import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../db/index.js';
import { env } from '../config/env.js';

export class HealthController {
  public static check = async (req: Request, res: Response): Promise<void> => {
    const dbStatus = await checkDatabaseHealth();
    const externalApiStatus = env.INTERN_API_KEY && env.INTERN_API_KEY.trim().length > 0 
      ? 'configured' 
      : 'not_configured';

    res.status(200).json({
      status: 'ok',
      service: 'INTERNHUB Platform API',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      externalInternshipApi: externalApiStatus,
      uptime: process.uptime()
    });
  };
}
