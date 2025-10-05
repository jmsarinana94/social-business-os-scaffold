'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthed, ready } = useAuth();

  // While auth state is initializing, show a tiny loader
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <span className="animate-pulse">Loading…</span>
      </div>
    );
  }

  // If we’re ready and not authenticated, bounce to /login
  useEffect(() => {
    if (ready && !isAuthed) {
      router.replace('/login');
    }
  }, [ready, isAuthed, router]);

  // If not authed, render nothing (we’ll redirect)
  if (!isAuthed) return null;

  // Otherwise, render protected content
  return <>{children}</>;
}