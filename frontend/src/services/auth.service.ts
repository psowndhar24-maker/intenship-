import { api } from './api';
import { LoginCredentials, AuthResponse, User } from '../types/auth';
import { HealthStatusResponse } from '../types/api';

export const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    return api.get<{ success: boolean; user: User }>('/auth/me');
  },

  checkHealth: async (): Promise<HealthStatusResponse> => {
    return api.get<HealthStatusResponse>('/health');
  }
};
