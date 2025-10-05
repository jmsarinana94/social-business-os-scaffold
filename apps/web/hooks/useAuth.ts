// apps/web/hooks/useAuth.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'sbo.token';
const ORG_KEY = 'sbo.org';

type LoginResponse = { access_token: string };

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read token/org on first client render
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      const orgFromEnv = process.env.NEXT_PUBLIC_ORG || 'org_demo';
      if (typeof window !== 'undefined') {
        const existingOrg = localStorage.getItem(ORG_KEY);
        if (!existingOrg) localStorage.setItem(ORG_KEY, orgFromEnv);
      }
      setToken(t);
    } finally {
      setReady(true);
    }
  }, []);

  const ORG = useMemo<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ORG_KEY) || process.env.NEXT_PUBLIC_ORG || 'org_demo';
    }
    return process.env.NEXT_PUBLIC_ORG || 'org_demo';
  }, []);

  // ---- LOGIN ----
  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await r.json().catch(() => null)) as LoginResponse | null;
      if (!r.ok || !data?.access_token) {
        throw new Error((data as any)?.message ?? 'Login failed');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(ORG_KEY, ORG);
      }
      setToken(data.access_token);
      return data.access_token;
    },
    [ORG]
  );

  // ---- SIGNUP ----
  const signup = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const r = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await r.json().catch(() => null)) as LoginResponse | null;
      if (!r.ok || !data?.access_token) {
        throw new Error((data as any)?.message ?? 'Signup failed');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(ORG_KEY, ORG);
      }
      setToken(data.access_token);
      return data.access_token;
    },
    [ORG]
  );

  // ---- LOGOUT ----
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ORG_KEY);
    }
    setToken(null);
  }, []);

  return {
    token,
    ready,
    error,
    login,
    signup,
    logout,
    org: ORG,
    isAuthed: !!token,
  };
}