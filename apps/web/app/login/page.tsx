'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, isAuthed, ready, error } = useAuth();

  const [email, setEmail] = useState('you@example.com');
  const [password, setPassword] = useState('test1234');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      router.push('/'); // go to dashboard/products
    } catch (err: any) {
      setMsg(err?.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  if (isAuthed) {
    // Already signed in — nudge to home
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Welcome</h1>

        {msg && <div className="text-sm text-red-600">{msg}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-slate-600">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black text-white py-2 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <div className="text-sm text-slate-600">
          {mode === 'login' ? (
            <>
              Don’t have an account?{' '}
              <button
                className="underline"
                onClick={() => {
                  setMsg(null);
                  setMode('signup');
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className="underline"
                onClick={() => {
                  setMsg(null);
                  setMode('login');
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}