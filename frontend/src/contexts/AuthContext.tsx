'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('transitops_token');
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async (tkn: string) => {
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      setUser(res.data);
    } catch {
      // Token is invalid/expired — clear it
      localStorage.removeItem('transitops_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  // On mount, restore token from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('transitops_token');
    if (stored) {
      setToken(stored);
      fetchMe(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const tkn: string = res.data.access_token;
    localStorage.setItem('transitops_token', tkn);
    setToken(tkn);
    await fetchMe(tkn);
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
