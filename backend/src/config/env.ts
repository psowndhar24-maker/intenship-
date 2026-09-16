import dotenv from 'dotenv';
import path from 'path';

// Load environment configuration
dotenv.config();

export interface EnvironmentConfig {
  DATABASE_URL?: string;
  JWT_SECRET: string;
  INTERN_API_KEY?: string;
  PORT: number;
  NODE_ENV: string;
  DEBUG: boolean;
  FRONTEND_URL?: string;
  EXTERNAL_SYNC_ENABLED: boolean;
  EXTERNAL_SYNC_INTERVAL_MINUTES: number;
}

export interface SafeConfigStatus {
  databaseConfigured: boolean;
  databaseMode: 'remote_postgresql' | 'embedded_pglite';
  jwtConfigured: boolean;
  externalApiConfigured: boolean;
  externalSyncEnabled: boolean;
  externalSyncIntervalMinutes: number;
}

/**
 * Validates and returns the centralized application configuration.
 * Adheres strictly to security and isolation policies:
 * - Reads all backend environment variables from this single module
 * - DATABASE_URL and JWT_SECRET are the core infrastructure variables
 * - INTERN_API_KEY is strictly optional and does not block startup
 * - Leaks no secret values in messages, logs, or error returns
 */
function loadAndValidateConfig(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // 1. JWT_SECRET configuration & validation
  const rawJwtSecret = process.env.JWT_SECRET?.trim();
  let jwtSecret = rawJwtSecret;

  if (!jwtSecret || jwtSecret.length === 0) {
    if (isProduction) {
      // Secret-safe error message matching security policy
      throw new Error('Required server configuration is missing.');
    }
    // Safe development fallback for local workspace & preview
    jwtSecret = 'internhub_dev_secret_key_matrix_2026';
  }

  // 2. DATABASE_URL configuration (PostgreSQL remote connection string)
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  const isValidDbUrl = Boolean(
    rawDatabaseUrl &&
    (rawDatabaseUrl.startsWith('postgresql://') || rawDatabaseUrl.startsWith('postgres://'))
  );
  const databaseUrl = isValidDbUrl ? rawDatabaseUrl : undefined;

  // 3. INTERN_API_KEY configuration (Optional external internship API credential)
  const rawInternApiKey = process.env.INTERN_API_KEY?.trim();
  const internApiKey = rawInternApiKey && rawInternApiKey.length > 0 ? rawInternApiKey : undefined;

  // 4. PORT & Server runtime flags
  const rawPort = process.env.PORT?.trim();
  const port = rawPort && !isNaN(Number(rawPort)) ? Number(rawPort) : 3000;
  const debug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

  // 5. FRONTEND_URL for production CORS
  const rawFrontendUrl = process.env.FRONTEND_URL?.trim();
  const frontendUrl = rawFrontendUrl && rawFrontendUrl.length > 0 ? rawFrontendUrl : undefined;

  // 6. Automatic Synchronization settings
  const externalSyncEnabled = process.env.EXTERNAL_SYNC_ENABLED === 'true';
  const rawInterval = process.env.EXTERNAL_SYNC_INTERVAL_MINUTES?.trim();
  const externalSyncIntervalMinutes = rawInterval && !isNaN(Number(rawInterval)) ? Math.max(1, Number(rawInterval)) : 360;

  return {
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    INTERN_API_KEY: internApiKey,
    PORT: port,
    NODE_ENV: nodeEnv,
    DEBUG: debug,
    FRONTEND_URL: frontendUrl,
    EXTERNAL_SYNC_ENABLED: externalSyncEnabled,
    EXTERNAL_SYNC_INTERVAL_MINUTES: externalSyncIntervalMinutes
  };
}

export const env: EnvironmentConfig = loadAndValidateConfig();

/**
 * Validates the runtime environment on backend startup.
 * Throws a sanitized, secret-free error if mandatory production variables are missing.
 */
export function validateEnv(): void {
  if (env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '')) {
    throw new Error('Required server configuration is missing.');
  }
}

/**
 * Returns safe boolean status indicators without exposing any secret strings or credentials.
 */
export function getSafeConfigStatus(): SafeConfigStatus {
  return {
    databaseConfigured: Boolean(env.DATABASE_URL || true), // PGlite embedded database is always ready as local driver
    databaseMode: env.DATABASE_URL ? 'remote_postgresql' : 'embedded_pglite',
    jwtConfigured: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0),
    externalApiConfigured: Boolean(env.INTERN_API_KEY && env.INTERN_API_KEY.trim().length > 0),
    externalSyncEnabled: env.EXTERNAL_SYNC_ENABLED,
    externalSyncIntervalMinutes: env.EXTERNAL_SYNC_INTERVAL_MINUTES
  };
}
