import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ExternalInternshipService } from './externalInternshipService.js';

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Initializes automatic background synchronization if enabled via configuration.
 * Default behavior: EXTERNAL_SYNC_ENABLED=false (scheduler remains inactive).
 */
export function startSyncScheduler(): void {
  if (!env.EXTERNAL_SYNC_ENABLED) {
    logger.info('External internship automatic sync is disabled (EXTERNAL_SYNC_ENABLED=false).');
    return;
  }

  const intervalMinutes = Math.max(1, env.EXTERNAL_SYNC_INTERVAL_MINUTES || 360);
  const intervalMs = intervalMinutes * 60 * 1000;

  logger.info(`Starting automatic external internship sync scheduler every ${intervalMinutes} minutes.`);

  schedulerTimer = setInterval(async () => {
    try {
      logger.info('Running scheduled external internship synchronization...');
      await ExternalInternshipService.syncInternships('scheduled_job');
    } catch (err) {
      logger.warn('Scheduled external internship synchronization failed safely:', err instanceof Error ? err.message : 'Unknown error');
    }
  }, intervalMs);
}

export function stopSyncScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info('External internship sync scheduler stopped.');
  }
}
