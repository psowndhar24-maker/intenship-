export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp?: string;
}

export interface HealthStatusResponse {
  status: 'ok';
  service?: string;
  timestamp?: string;
  database?: string;
  externalInternshipApi?: 'configured' | 'not_configured';
  uptime?: number;
}
