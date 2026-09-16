import { storage } from '../utils/storage';

/**
 * Returns the sanitized base URL for API requests.
 * Supports:
 * - Empty / unset: defaults to '/api' (same-origin relative)
 * - Explicit relative path: e.g. '/api'
 * - Absolute production backend URL: e.g. 'https://api.internhub.org' or 'https://api.internhub.org/api'
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env?.VITE_API_URL || '').trim();
  if (!envUrl) {
    return '/api';
  }
  // Strip any trailing slashes
  return envUrl.replace(/\/+$/, '');
}

/**
 * Centrally builds safe API request URLs.
 * Guarantees no:
 * - /api/api/login duplicate prefixes
 * - undefined/api/login
 * - missing /api prefix when pointing to an absolute backend domain
 * - duplicate slashes
 */
export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Case 1: Same-origin relative path (e.g. '/api' or '/')
  if (base.startsWith('/')) {
    const cleanBase = base === '/' ? '' : base;
    if (cleanBase && cleanEndpoint.startsWith(cleanBase)) {
      return cleanEndpoint;
    }
    return `${cleanBase}${cleanEndpoint}`;
  }

  // Case 2: Absolute backend URL (e.g. 'https://my-backend.domain')
  try {
    const parsed = new URL(base);
    let pathname = parsed.pathname.replace(/\/+$/, '');

    // If backend URL does not end with /api, and endpoint does not start with /api, route through /api
    if (!pathname.endsWith('/api') && !cleanEndpoint.startsWith('/api')) {
      pathname = `${pathname}/api`;
    } else if (pathname.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
      // Avoid duplicate /api/api
      cleanEndpoint = cleanEndpoint.substring(4);
    }

    parsed.pathname = (pathname === '/' ? '' : pathname) + cleanEndpoint;
    return parsed.toString();
  } catch {
    // Fallback if URL parsing fails
    return `${base}${cleanEndpoint}`;
  }
}

export const API_BASE_URL = getApiBaseUrl();

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    details?: unknown,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, body, ...customConfig } = options;

  let url = buildApiUrl(endpoint);

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = storage.getToken();

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined && !(body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    body: body !== undefined ? (body instanceof FormData || typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    let parsedData: any = null;

    if (contentType.includes('application/json')) {
      parsedData = await response.json();
      // If the backend sent a JSON-encoded string, decode it safely; otherwise use data directly
      if (typeof parsedData === 'string') {
        try {
          const inner = JSON.parse(parsedData);
          if (inner && typeof inner === 'object') {
            parsedData = inner;
          }
        } catch {
          // Keep parsedData as string if not JSON
        }
      }
    } else {
      const text = await response.text();
      parsedData = text;
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorCode = `HTTP_${response.status}`;
      let errorDetails: unknown = undefined;

      if (parsedData && typeof parsedData === 'object') {
        if (typeof parsedData.error === 'string') {
          errorMessage = parsedData.error;
        } else if (parsedData.error && typeof parsedData.error === 'object') {
          errorMessage = parsedData.error.message || errorMessage;
          errorCode = parsedData.error.code || errorCode;
          errorDetails = parsedData.error.details;
        } else if (parsedData.message) {
          errorMessage = parsedData.message;
        }
        if (parsedData.code) {
          errorCode = parsedData.code;
        }
      } else if (typeof parsedData === 'string' && parsedData.trim().length > 0) {
        // If an HTML error page was returned (e.g., from static host 404 or CDN proxy 502)
        if (parsedData.trim().startsWith('<') || parsedData.toLowerCase().includes('<!doctype')) {
          if (response.status === 404) {
            errorMessage = 'API endpoint not found. Please verify the production API server is deployed and reachable.';
          } else if (response.status === 502 || response.status === 503 || response.status === 504) {
            errorMessage = 'Backend service is currently unavailable. Please try again in a few moments.';
          } else {
            errorMessage = `Server responded with status ${response.status}.`;
          }
        } else {
          errorMessage = parsedData;
        }
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    return parsedData as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Determine if the error is a fetch/network transport failure
    const rawMsg = err instanceof Error ? err.message : 'Network error';
    const isNetworkOrFetch =
      rawMsg.toLowerCase().includes('fetch') ||
      rawMsg.toLowerCase().includes('network') ||
      rawMsg.toLowerCase().includes('load failed') ||
      rawMsg.toLowerCase().includes('cors') ||
      err instanceof TypeError;

    const message = isNetworkOrFetch
      ? 'Unable to connect to the server. Please check the server connection and try again.'
      : rawMsg;

    throw new ApiError(message, 0, 'NETWORK_UNAVAILABLE', undefined, true);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
