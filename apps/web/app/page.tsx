'use client';

import { useEffect, useState } from 'react';

const TOKEN_KEY = 'sbo_token';

export default function HomePage() {
  const [token, setToken] = useState<string | null | 'checking'>('checking');

  useEffect(() => {
    try {
      const t = typeof window !== 'undefined'
        ? (localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token'))
        : null;
      setToken(t ?? null);
    } catch (e) {
      console.error('Token read failed:', e);
      setToken(null);
    }
  }, []);

  if (token === 'checking') {
    return <div>Checking session…</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {token ? (
        <div className="rounded-lg border bg-white p-4">
          <p className="mb-3">You appear to be logged in.</p>
          <div className="flex gap-3">
            <a className="rounded-lg bg-black px-4 py-2 text-white" href="/products">View Products</a>
            <button
              className="rounded-lg border px-4 py-2"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('token');
                location.reload();
              }}
            >
              Log out (clear token)
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-4">
          <p className="mb-3">No token found.</p>
          <a className="rounded-lg bg-black px-4 py-2 text-white" href="/login">Go to Login</a>
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        <div className="font-medium mb-2">Debug</div>
        <ul className="list-disc pl-6 space-y-1">
          <li>Try <a className="underline" href="/login">/login</a> to sign in.</li>
          <li>Try <a className="underline" href="/products">/products</a> after logging in.</li>
          <li>Check the browser console (View → Developer → JavaScript Console) for errors.</li>
        </ul>
      </div>
    </div>
  );
}