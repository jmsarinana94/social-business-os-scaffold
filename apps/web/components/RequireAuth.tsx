// apps/web/components/RequireAuth.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'sbo.token';

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // client-side: read token from localStorage
    const token = typeof window !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY)
      : null;

    if (!token) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return <div className="p-6 text-sm text-gray-600">Checking session…</div>;
  }

  return <>{children}</>;
}