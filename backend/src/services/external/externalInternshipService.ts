import crypto from 'crypto';
import { env } from '../../config/env.js';
import { query } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import {
  ConfiguredInternshipProvider,
  ExternalServiceUnavailableError,
  InternshipProvider,
} from './internshipProvider.js';
import {
  ExternalApiStatusResponse,
  ExternalApiStatusType,
  ExternalInternshipFilter,
  ExternalInternshipItem,
  SyncResult,
} from './providerTypes.js';

/**
 * Service managing external internship integration, sync orchestration, and moderation onboarding.
 * Preserves the primary database as the source of truth and enforces that all imported listings
 * require administrator moderation before becoming discoverable to students.
 */
export class ExternalInternshipService {
  private static provider: InternshipProvider = new ConfiguredInternshipProvider();
  private static lastSyncTimestamp: string | null = null;
  private static lastSyncResult: SyncResult | null = null;

  /**
   * Check if external credentials are provided in configuration.
   */
  public static isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Set a custom provider adapter for testing or vendor extension.
   */
  public static setProvider(newProvider: InternshipProvider): void {
    this.provider = newProvider;
  }

  /**
   * Get safe diagnostic status of the external internship integration.
   * Never leaks API keys or headers.
   */
  public static async getStatus(): Promise<ExternalApiStatusResponse> {
    const statusType: ExternalApiStatusType = await this.provider.getStatus();

    // If no recent in-memory sync timestamp, check database sync logs
    if (!this.lastSyncTimestamp) {
      try {
        const lastLog = await query<{ created_at: string }>(
          `SELECT created_at FROM external_sync_logs ORDER BY created_at DESC LIMIT 1`
        );
        if (lastLog.rows.length > 0) {
          this.lastSyncTimestamp = new Date(lastLog.rows[0].created_at).toISOString();
        }
      } catch (err) {
        // Table may be initializing, ignore safely
      }
    }

    return {
      status: statusType,
      providerName: this.provider.name,
      lastSyncTime: this.lastSyncTimestamp,
      syncEnabled: env.EXTERNAL_SYNC_ENABLED,
      syncIntervalMinutes: env.EXTERNAL_SYNC_INTERVAL_MINUTES,
    };
  }

  /**
   * Perform safe search across external internship sources.
   */
  public static async search(filter: ExternalInternshipFilter): Promise<ExternalInternshipItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      return await this.provider.searchInternships(filter);
    } catch (err) {
      logger.warn('External internship search error:', err instanceof Error ? err.message : 'Unknown error');
      throw new ExternalServiceUnavailableError();
    }
  }

  /**
   * Retrieve details for an external listing.
   */
  public static async getDetails(id: string): Promise<ExternalInternshipItem | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      return await this.provider.fetchInternshipDetails(id);
    } catch (err) {
      logger.warn('External internship detail retrieval error:', err instanceof Error ? err.message : 'Unknown error');
      throw new ExternalServiceUnavailableError();
    }
  }

  /**
   * Synchronize external listings into the placement governance database.
   * Enforces sync safety protections:
   * 1. Never duplicates existing records (checks external_source + external_id)
   * 2. Never overwrites admin-approved content
   * 3. Sets all imported records to status = 'PENDING_APPROVAL' (moderation required)
   * 4. Logs sync event and audit trails
   */
  public static async syncInternships(triggeredBy = 'system'): Promise<SyncResult> {
    const timestamp = new Date().toISOString();

    if (!this.isConfigured()) {
      const result: SyncResult = {
        fetched: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        provider: this.provider.name,
        timestamp,
        message: 'External API key is not configured. Sync skipped.',
      };
      this.lastSyncTimestamp = timestamp;
      this.lastSyncResult = result;
      return result;
    }

    let fetchedItems: ExternalInternshipItem[] = [];
    try {
      fetchedItems = await this.provider.fetchFeedForSync(50);
    } catch (err) {
      logger.error('Failed to query external provider feed during sync:', err instanceof Error ? err.message : 'Error');
      throw new ExternalServiceUnavailableError('External internship service is currently unavailable.');
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of fetchedItems) {
      try {
        if (!item.externalId || !item.title || !item.companyName) {
          failed++;
          continue;
        }

        const providerName = item.provider || this.provider.name;

        // Check if record already exists by external reference
        const existing = await query<{
          id: string;
          status: string;
          title: string;
        }>(
          `SELECT id, status, title FROM internships WHERE external_source = $1 AND external_id = $2 LIMIT 1`,
          [providerName, item.externalId]
        );

        if (existing.rows.length > 0) {
          const record = existing.rows[0];

          // Protection: Never overwrite admin-approved or rejected content unexpectedly
          if (record.status === 'APPROVED' || record.status === 'REJECTED') {
            await query(
              `UPDATE internships SET last_synced_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [record.id]
            );
            skipped++;
            continue;
          }

          // If still pending approval, update metadata safely
          await query(
            `UPDATE internships 
             SET title = $1, description = $2, stipend = $3, application_deadline = $4,
                 external_url = $5, last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6`,
            [
              item.title,
              item.description,
              item.stipend || 'Unspecified',
              item.applicationDeadline,
              item.sourceUrl || null,
              record.id,
            ]
          );
          updated++;
        } else {
          // Find or create company entry for the external organization
          let companyId: string;
          const existingCompany = await query<{ id: string }>(
            `SELECT id FROM companies WHERE company_name ILIKE $1 LIMIT 1`,
            [item.companyName.trim()]
          );

          if (existingCompany.rows.length > 0) {
            companyId = existingCompany.rows[0].id;
          } else {
            companyId = `cmp_ext_${crypto.randomUUID().slice(0, 8)}`;
            await query(
              `INSERT INTO companies (
                id, company_name, description, website, email, location, verification_status
              ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
              [
                companyId,
                item.companyName.trim(),
                `Imported corporate entity via ${providerName}`,
                item.companyWebsite || null,
                item.companyEmail || null,
                item.companyLocation || item.location || 'Remote',
              ]
            );
          }

          // Insert new internship with status 'PENDING_APPROVAL' (Enforces directorate moderation)
          const newInternshipId = `int_ext_${crypto.randomUUID().slice(0, 8)}`;
          await query(
            `INSERT INTO internships (
              id, company_id, title, category, description, internship_type, location,
              work_mode, duration, stipend, currency, is_paid, experience_level,
              education, eligibility, responsibilities, benefits, learning_opportunities,
              selection_process, application_deadline, status, external_source, external_id,
              external_url, last_synced_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'PENDING_APPROVAL', $21, $22, $23, CURRENT_TIMESTAMP
            )`,
            [
              newInternshipId,
              companyId,
              item.title,
              item.category || 'Engineering',
              item.description,
              item.internshipType || 'Full-time Internship',
              item.location || 'Remote',
              item.workMode || 'Remote',
              item.duration || '3 Months',
              item.stipend || 'Competitive Stipend',
              item.currency || 'INR',
              item.isPaid ?? true,
              item.experienceLevel || 'Entry Level',
              item.education || 'Undergraduate / Graduate',
              item.eligibility || 'Open to verified university students',
              item.responsibilities || item.description,
              item.benefits || 'Mentorship, certificate of internship, PPO opportunity',
              item.learningOpportunities || 'Practical technical systems experience',
              item.selectionProcess || 'Directorate review & online assessment',
              item.applicationDeadline,
              providerName,
              item.externalId,
              item.sourceUrl || null,
            ]
          );

          // Audit record
          const auditId = `aud_${crypto.randomUUID().slice(0, 8)}`;
          await query(
            `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
             VALUES ($1, $2, 'IMPORT_EXTERNAL_INTERNSHIP', 'INTERNSHIP', $3, $4)`,
            [
              auditId,
              triggeredBy.startsWith('usr_') ? triggeredBy : null,
              newInternshipId,
              JSON.stringify({
                provider: providerName,
                externalId: item.externalId,
                title: item.title,
                company: item.companyName,
              }),
            ]
          );

          imported++;
        }
      } catch (err) {
        logger.warn('Failed to process external internship sync item:', err instanceof Error ? err.message : 'Unknown item error');
        failed++;
      }
    }

    const result: SyncResult = {
      fetched: fetchedItems.length,
      imported,
      updated,
      skipped,
      failed,
      provider: this.provider.name,
      timestamp,
      message: `Sync completed: ${imported} imported, ${updated} updated, ${skipped} preserved, ${failed} failed.`,
    };

    // Store sync log into database
    try {
      const logId = `synclog_${crypto.randomUUID().slice(0, 8)}`;
      await query(
        `INSERT INTO external_sync_logs (
          id, triggered_by, provider, fetched_count, imported_count, updated_count, skipped_count, failed_count, status, message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COMPLETED', $9)`,
        [
          logId,
          triggeredBy,
          this.provider.name,
          result.fetched,
          result.imported,
          result.updated,
          result.skipped,
          result.failed,
          result.message,
        ]
      );
    } catch (logErr) {
      logger.warn('Failed to persist sync log record:', logErr instanceof Error ? logErr.message : 'Log error');
    }

    this.lastSyncTimestamp = timestamp;
    this.lastSyncResult = result;

    logger.info('External internship synchronization completed', {
      fetched: result.fetched,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
    });

    return result;
  }
}
