export type UserRole = 'STUDENT' | 'COMPANY' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  email: string;
  department?: string;
  companyName?: string;
  systemPermissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  issuedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
