import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiFetch } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('adms_qris_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adms_qris_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const res = await apiFetch('/auth/me');
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('adms_qris_user', JSON.stringify(res.data.user));
    } else {
      setUser(null);
      setToken(null);
      localStorage.removeItem('adms_qris_token');
      localStorage.removeItem('adms_qris_user');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('adms_qris_token', res.data.token);
      localStorage.setItem('adms_qris_user', JSON.stringify(res.data.user));
      return { success: true, message: res.message };
    }

    return { success: false, message: res.message || 'Login gagal' };
  };

  const logout = () => {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('adms_qris_token');
    localStorage.removeItem('adms_qris_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
