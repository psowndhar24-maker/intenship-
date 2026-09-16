import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, LoginCredentials, UserRole } from '../types/auth';
import { AuthService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { ApiError } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; role: UserRole }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Validate stored token on mount if present
  useEffect(() => {
    const existingToken = storage.getToken();
    if (existingToken) {
      AuthService.getCurrentUser()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            storage.setAuth(existingToken, res.user);
          }
        })
        .catch(() => {
          // Token expired or invalid, reset
          storage.clearAuth();
          setUser(null);
          setToken(null);
        });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; role: UserRole }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthService.login(credentials);
      
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        storage.setAuth(response.token, response.user);
        setIsLoading(false);
        return { success: true, role: response.user.role };
      }

      throw new Error(response.message || 'Login failed');
    } catch (err) {
      setIsLoading(false);
      let errorMsg = 'Authentication failed. Please verify credentials.';
      if (err instanceof ApiError) {
        if (err.isNetworkError || err.code === 'NETWORK_UNAVAILABLE' || err.status === 0) {
          errorMsg = 'Unable to connect to the server. Please check the server connection and try again.';
        } else {
          errorMsg = err.message;
        }
      } else if (err instanceof Error) {
        const lower = err.message.toLowerCase();
        if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
          errorMsg = 'Unable to connect to the server. Please check the server connection and try again.';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    storage.clearAuth();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
