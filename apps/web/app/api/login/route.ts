// apps/web/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/v1';
  const ORG = process.env.NEXT_PUBLIC_ORG || 'org_demo';

  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-org-id': ORG,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(
      { message: data?.message || 'Login failed' },
      { status: r.status }
    );
  }

  const data = await r.json();
  // (Optional later: set an httpOnly cookie here.)
  return NextResponse.json(data);
}