import { storage } from '../utils/storage';

export const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, body, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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
        errorMessage = parsedData;
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    return parsedData as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network communication error';
    throw new ApiError(message, 0, 'NETWORK_ERROR');
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
