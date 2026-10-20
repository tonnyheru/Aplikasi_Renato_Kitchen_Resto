import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiRequest, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<boolean>;
  hasRole: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const res = await apiRequest<User>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        removeStoredToken();
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, message: res.message || 'Login gagal.' };
  };

  const logout = async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: Role) => {
    setIsLoading(true);
    const res = await apiRequest<{ token: string; user: User }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    if (res.success && res.data) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true; // Owner has super-admin access
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
