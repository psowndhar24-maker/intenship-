import express, { Express, Request, Response, NextFunction } from 'express';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';
import { env, validateEnv, getSafeConfigStatus } from './config/env.js';

export function createExpressApp(): Express {
  // Validate required environment settings safely
  validateEnv();

  const app = express();

  // Basic request body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Production-grade CORS middleware supporting configurable FRONTEND_URL
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const isProduction = env.NODE_ENV === 'production';

    // Parse configured frontend URLs (supports comma-separated origins)
    const configuredOrigins: string[] = [];
    if (env.FRONTEND_URL) {
      env.FRONTEND_URL.split(',').forEach((url) => {
        const trimmed = url.trim().replace(/\/+$/, '');
        if (trimmed) configuredOrigins.push(trimmed);
      });
    }

    let isAllowed = false;

    if (!origin) {
      // Same-origin, direct server-to-server, or curl requests
      isAllowed = true;
    } else if (configuredOrigins.includes(origin.replace(/\/+$/, ''))) {
      isAllowed = true;
    } else if (!isProduction) {
      // Local development origins
      isAllowed = true;
    } else if (configuredOrigins.length === 0) {
      // Production fallback if FRONTEND_URL is not yet explicitly configured
      isAllowed = true;
    } else {
      // Check if origin matches a preview deployment of configured base domain
      const isSubdomain = configuredOrigins.some((base) => {
        try {
          const baseHost = new URL(base).hostname;
          const originHost = new URL(origin).hostname;
          return originHost.endsWith(baseHost) || (baseHost.includes('vercel.app') && originHost.endsWith('.vercel.app'));
        } catch {
          return false;
        }
      });
      if (isSubdomain) isAllowed = true;
    }

    if (isAllowed && origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else if (isAllowed) {
      res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Request telemetry
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith('/api')) {
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Mount API Router under /api (includes /api/health with database & external API status)
  app.use('/api', apiRouter);

  // Central error handling middleware
  app.use(errorHandler);

  return app;
}

export function startStandaloneServer(port = 3000) {
  const app = createExpressApp();
  const PORT = env.PORT || port;
  const configStatus = getSafeConfigStatus();

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`INTERNHUB Backend API active on http://0.0.0.0:${PORT}`);
    logger.info(`Database mode: ${configStatus.databaseMode}`);
    logger.info(`External internship API configured: ${configStatus.externalApiConfigured}`);
    logger.info(`Health check live at http://0.0.0.0:${PORT}/api/health`);
  });

  return server;
}

// Auto-run if executed directly as main script
if (process.argv[1] && process.argv[1].endsWith('backend/src/server.ts')) {
  startStandaloneServer();
}

export default createExpressApp;
