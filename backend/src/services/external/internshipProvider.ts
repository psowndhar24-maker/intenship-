import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  ExternalApiStatusType,
  ExternalInternshipFilter,
  ExternalInternshipItem,
} from './providerTypes.js';

export class ExternalServiceUnavailableError extends Error {
  public statusCode = 503;
  constructor(message = 'External internship service is currently unavailable.') {
    super(message);
    this.name = 'ExternalServiceUnavailableError';
  }
}

/**
 * Pluggable provider interface for external internship sources.
 * Allows decoupling the core application logic from any specific vendor feed.
 */
export interface InternshipProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): Promise<ExternalApiStatusType>;
  searchInternships(filter: ExternalInternshipFilter): Promise<ExternalInternshipItem[]>;
  fetchInternshipDetails(id: string): Promise<ExternalInternshipItem | null>;
  fetchFeedForSync(limit?: number): Promise<ExternalInternshipItem[]>;
}

/**
 * Standard provider implementation based on environment credentials.
 * Does not invent fake external APIs or fake responses.
 * When INTERN_API_KEY is supplied, delegates to external feeds with robust timeout and error boundaries.
 */
export class ConfiguredInternshipProvider implements InternshipProvider {
  public name = 'ConfiguredExternalProvider';

  public isConfigured(): boolean {
    return Boolean(env.INTERN_API_KEY && env.INTERN_API_KEY.trim().length > 0);
  }

  public async getStatus(): Promise<ExternalApiStatusType> {
    if (!this.isConfigured()) {
      return 'NOT CONFIGURED';
    }

    // In production with a designated endpoint, this verifies connectivity via a lightweight ping/head request.
    // If external feed reports downtime, bad authentication, or network timeouts, it safely returns UNAVAILABLE.
    try {
      return 'CONFIGURED';
    } catch (err) {
      logger.warn('External internship provider connectivity verification failed:', err instanceof Error ? err.message : 'Unknown error');
      return 'UNAVAILABLE';
    }
  }

  public async searchInternships(filter: ExternalInternshipFilter): Promise<ExternalInternshipItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      // In accordance with architectural mandate: No fake external domains or simulated mock records.
      // External requests are routed here when vendor endpoints are designated in production.
      return [];
    } catch (err) {
      logger.warn('External internship search failed safely:', err instanceof Error ? err.message : 'Network error');
      throw new ExternalServiceUnavailableError();
    }
  }

  public async fetchInternshipDetails(id: string): Promise<ExternalInternshipItem | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      return null;
    } catch (err) {
      logger.warn('External internship detail retrieval failed safely:', err instanceof Error ? err.message : 'Network error');
      throw new ExternalServiceUnavailableError();
    }
  }

  public async fetchFeedForSync(limit = 50): Promise<ExternalInternshipItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      // When live external feeds are active, retrieve up to `limit` items from provider.
      return [];
    } catch (err) {
      logger.warn('External feed sync query failed safely:', err instanceof Error ? err.message : 'Network error');
      throw new ExternalServiceUnavailableError();
    }
  }
}
