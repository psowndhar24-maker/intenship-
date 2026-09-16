import { User } from '../types/auth';

const TOKEN_KEY = 'internhub_auth_token';
const USER_KEY = 'internhub_auth_user';

export const storage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getUser: (): User | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      let parsed = JSON.parse(raw);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return parsed && typeof parsed === 'object' ? (parsed as User) : null;
    } catch {
      return null;
    }
  },

  setAuth: (token: string, user: User): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      const userStr = typeof user === 'string' ? user : JSON.stringify(user);
      localStorage.setItem(USER_KEY, userStr);
    } catch (e) {
      console.warn('Failed to save authentication in local storage', e);
    }
  },

  clearAuth: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Failed to clear authentication from local storage', e);
    }
  }
};
