'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

type AuthState = {
  token: string | null;
  ready: boolean;
  error: string | null;
  org: string;
};

type AuthAPI = {
  token: string | null;
  ready: boolean;
  error: string | null;
  org: string;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<string>;
  signup: (email: string, password: string) => Promise<string>;
  logout: () => void;
};

// ---------- tiny store (no provider needed) ----------
const listeners = new Set<() => void>();

const DEFAULT_ORG = process.env.NEXT_PUBLIC_ORG ?? 'org_demo';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4001';

const state: AuthState = {
  token: null,
  ready: false,
  error: null,
  org: DEFAULT_ORG,
};

function notify() {
  for (const l of listeners) l();
}

function setState(patch: Partial<AuthState>) {
  Object.assign(state, patch);
  notify();
}

function initFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const t = localStorage.getItem('auth:token');
    setState({ token: t, ready: true, error: null, org: state.org });
  } catch {
    setState({ ready: true });
  }
}

// initialize on first import (client only)
if (typeof window !== 'undefined') {
  initFromStorage();
  // keep a single storage listener
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth:token') {
      setState({ token: e.newValue });
    }
  });
}

// ---------- network helpers ----------
async function apiPost<T>(
  path: string,
  body: unknown,
  org: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-org-id': org,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg = data?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

// ---------- public hook ----------
export function useAuth(): AuthAPI {
  // subscribe to store
  const subscribe = useMemo(
    () => (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    [],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state, // server snapshot (unused because this is 'use client')
  );

  const org = snapshot.org;

  const login = useRef<AuthAPI['login']>(async (email, password) => {
    const data = await apiPost<{ access_token: string }>(
      '/v1/auth/login',
      { email, password },
      org,
    );
    const token = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth:token', token);
    }
    setState({ token, error: null });
    return token;
  });

  const signup = useRef<AuthAPI['signup']>(async (email, password) => {
    const data = await apiPost<{ access_token: string }>(
      '/v1/auth/signup',
      { email, password },
      org,
    );
    const token = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth:token', token);
    }
    setState({ token, error: null });
    return token;
  });

  const logout = useRef<AuthAPI['logout']>(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth:token');
    }
    setState({ token: null });
  });

  // make sure we flip to ready on first client mount if not already
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!snapshot.ready && typeof window !== 'undefined') {
      initFromStorage();
    }
    setMounted(true);
  }, [snapshot.ready]);

  return {
    token: snapshot.token,
    ready: mounted ? snapshot.ready : false,
    error: snapshot.error,
    org,
    isAuthed: !!snapshot.token,
    login: login.current,
    signup: signup.current,
    logout: logout.current,
  };
}