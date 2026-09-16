import { api } from './api';

export type ExternalApiStatus = 'CONFIGURED' | 'NOT CONFIGURED' | 'UNAVAILABLE';

export interface ExternalStatusResponse {
  status: ExternalApiStatus;
  providerName: string;
  lastSyncTime: string | null;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
}

export interface SyncStatsResult {
  fetched: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  provider: string;
  timestamp: string;
  message: string;
}

export const externalInternshipService = {
  /**
   * Get safe diagnostic status for external internship integration.
   * Never exposes credentials, tokens, or headers.
   */
  async getStatus(): Promise<ExternalStatusResponse> {
    const res = await api.get<{ success: boolean; data: ExternalStatusResponse }>(
      '/external-internships/status'
    );
    return res.data;
  },

  /**
   * Admin-only trigger to safely synchronize external internships.
   * Staged into PENDING_APPROVAL under institutional moderation.
   */
  async triggerAdminSync(): Promise<SyncStatsResult> {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: SyncStatsResult;
    }>('/admin/external-internships/sync', {});
    return res.data;
  },
};
