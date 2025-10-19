// apps/web/components/Nav.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'sbo.token';
const ORG_KEY = 'sbo.org';

export default function Nav() {
  const router = useRouter();

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ORG_KEY);
    router.push('/login');
  };

  return (
    <nav className="flex items-center justify-between border-b bg-white/70 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold">SBO</Link>
        <Link href="/products" className="text-sm text-gray-600 hover:text-black">
          Products
        </Link>
      </div>
      <button
        onClick={onLogout}
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        aria-label="Log out"
      >
        Logout
      </button>
    </nav>
  );
}