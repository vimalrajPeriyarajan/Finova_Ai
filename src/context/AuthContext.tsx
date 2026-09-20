import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { api, getAuthToken, setAuthToken } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (type: 'STUDENT' | 'ADMIN') => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        setAuthToken(null);
        setTokenState(null);
      }
    } catch (err) {
      setUser(null);
      setAuthToken(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no token exists on first load, auto-login with default student account for instant demo experience
    const initialToken = getAuthToken();
    if (!initialToken) {
      login('student@finova.in', 'password123').finally(() => {
        setIsLoading(false);
      });
    } else {
      fetchCurrentUser();
    }

    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };

    window.addEventListener('finova:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('finova:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setTokenState(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login error' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        setTokenState(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Registration error' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  const switchUser = async (type: 'STUDENT' | 'ADMIN') => {
    if (type === 'ADMIN') {
      await login('admin@finova.in', 'admin123');
    } else {
      await login('student@finova.in', 'password123');
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const res = await api.auth.deleteAccount();
      if (res.success) {
        logout();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
