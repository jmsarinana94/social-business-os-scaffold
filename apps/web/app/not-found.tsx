import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm text-center">
      <h1 className="text-2xl font-semibold mb-2">404 — Not Found</h1>
      <p className="text-sm text-gray-600 mb-6">
        The page you’re looking for doesn’t exist.
      </p>
      <Link href="/" className="inline-block rounded-lg bg-black px-4 py-2 text-white">
        Go home
      </Link>
    </div>
  );
}