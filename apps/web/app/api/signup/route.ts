// apps/web/app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ message: 'Missing email or password' }, { status: 400 });
  }

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/v1';
  const org = process.env.NEXT_PUBLIC_ORG || 'org_demo';

  try {
    const res = await fetch(`${api}/auth/signup`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-org-id': org,
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || 'Signup failed', status: res.status },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Failed to reach API' },
      { status: 502 }
    );
  }
}