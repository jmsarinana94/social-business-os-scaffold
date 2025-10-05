'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Global error:', error);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">App crashed</h1>
          <p className="text-sm text-gray-600 mb-4">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          {error?.digest && (
            <p className="text-xs text-gray-400 mb-4">Error id: {error.digest}</p>
          )}
          <div className="flex gap-3">
            <button className="rounded-lg bg-black px-4 py-2 text-white" onClick={() => reset()}>
              Reload app
            </button>
            <a className="rounded-lg border px-4 py-2" href="/">Go home</a>
          </div>
        </div>
      </body>
    </html>
  );
}