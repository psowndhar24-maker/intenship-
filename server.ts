import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/src/server.js';
import { getDbClient } from './backend/src/db/index.js';
import { logger } from './backend/src/utils/logger.js';
import { env, getSafeConfigStatus } from './backend/src/config/env.js';
import { startSyncScheduler } from './backend/src/services/external/syncScheduler.js';

async function bootstrap() {
  // Safe environment status
  const configStatus = getSafeConfigStatus();
  logger.info('System configuration loaded', {
    databaseMode: configStatus.databaseMode,
    databaseConfigured: configStatus.databaseConfigured,
    jwtConfigured: configStatus.jwtConfigured,
    externalApiConfigured: configStatus.externalApiConfigured,
    externalSyncEnabled: configStatus.externalSyncEnabled
  });

  // Ensure database schema and seed accounts are initialized
  try {
    await getDbClient();
    logger.info('Database layer verified and initialized');
  } catch (err) {
    logger.error('Database initialization notice:', err instanceof Error ? err.message : 'Error');
  }

  // Initialize external sync scheduler if enabled in configuration
  startSyncScheduler();

  const app = createExpressApp();
  const PORT = 3000;

  // Serve static assets from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use(express.static(path.join(process.cwd(), 'frontend', 'public')));

  // In development, mount Vite middleware to serve client SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    logger.info('Vite development middleware mounted');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    logger.info(`Serving production static bundle from ${distPath}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`====================================================`);
    logger.info(`INTERNHUB Core Platform Server initialized`);
    logger.info(`Server Port: ${PORT}`);
    logger.info(`Bound Host:  0.0.0.0`);
    logger.info(`Health API:  http://0.0.0.0:${PORT}/api/health`);
    logger.info(`Auth API:    http://0.0.0.0:${PORT}/api/auth/login`);
    logger.info(`Platform:    http://0.0.0.0:${PORT}/`);
    logger.info(`====================================================`);
  });

  return server;
}

bootstrap().catch((err) => {
  console.error('Fatal startup error in INTERNHUB server:', err);
  process.exit(1);
});
