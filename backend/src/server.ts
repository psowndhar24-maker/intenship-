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

  // CORS and security headers for API
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
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
