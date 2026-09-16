export type ExternalApiStatusType = 'CONFIGURED' | 'NOT CONFIGURED' | 'UNAVAILABLE';

export interface ExternalInternshipFilter {
  query?: string;
  category?: string;
  location?: string;
  workMode?: string;
  page?: number;
  limit?: number;
}

export interface ExternalInternshipItem {
  externalId: string;
  title: string;
  companyName: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyLocation?: string;
  category: string;
  description: string;
  internshipType: string;
  location: string;
  workMode: string;
  duration: string;
  stipend: string;
  currency?: string;
  isPaid?: boolean;
  experienceLevel?: string;
  education?: string;
  eligibility?: string;
  responsibilities?: string;
  benefits?: string;
  learningOpportunities?: string;
  selectionProcess?: string;
  applicationDeadline: string;
  sourceUrl?: string;
  provider: string;
}

export interface SyncResult {
  fetched: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  provider: string;
  timestamp: string;
  message: string;
}

export interface ExternalApiStatusResponse {
  status: ExternalApiStatusType;
  providerName: string;
  lastSyncTime: string | null;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
}
