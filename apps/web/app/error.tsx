'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-600 mb-4">
        {error?.message || 'An unexpected error occurred.'}
      </p>
      {error?.digest && (
        <p className="text-xs text-gray-400 mb-4">Error id: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button className="rounded-lg bg-black px-4 py-2 text-white" onClick={() => reset()}>
          Try again
        </button>
        <a className="rounded-lg border px-4 py-2" href="/">Go home</a>
      </div>
    </div>
  );
}