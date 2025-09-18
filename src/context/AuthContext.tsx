'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthUser = { id: string; name: string; email: string; role: 'admin' | 'driver' };
type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kl_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user ?? null);
        setToken(parsed.token ?? null);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login: AuthState['login'] = async ({ email, password }) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const nextUser: AuthUser = data.user;
      const nextToken: string = data.token;
      setUser(nextUser);
      setToken(nextToken);
      localStorage.setItem('kl_auth', JSON.stringify({ user: nextUser, token: nextToken }));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kl_auth');
  };

  const value = useMemo<AuthState>(() => ({ user, token, loading, login, logout }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


