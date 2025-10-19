'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  sku: string;
  title: string;
  type: 'PHYSICAL' | 'DIGITAL';
  status: 'ACTIVE' | 'INACTIVE';
  price: number;
  inventoryQty: number | null;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001/v1').replace(/\/+$/, ''),
    []
  );
  const ORG_ID = useMemo(
    () => (process.env.NEXT_PUBLIC_ORG_ID || 'org_demo'),
    []
  );
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('sbo_token') : null), []);

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        if (!token) {
          setErr('No token found. Please log in.');
          return;
        }
        const res = await fetch(`${API_BASE}/products?limit=50`, {
          headers: {
            'authorization': `Bearer ${token}`,
            'x-org-id': ORG_ID,
          },
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const data = await res.json();
            if (data?.message) msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        setItems(Array.isArray(data?.items) ? data.items : data);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load products');
      }
    })();
  }, [API_BASE, ORG_ID, token]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/">SBO</Link>{' '}•{' '}
        <Link href="/login">Login</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Products</h1>

      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>{err}</div>}

      {!items && !err && <div>Loading…</div>}

      {items && items.length === 0 && <div>No products found.</div>}

      {items && items.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((p) => (
            <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{p.sku}</div>
              <div style={{ marginTop: 6, fontSize: 14 }}>
                {p.type} • {p.status} • ${p.price.toFixed(2)} {p.inventoryQty != null ? `• Inventory: ${p.inventoryQty}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 12, border: '1px solid #ddd', borderRadius: 6, maxWidth: 640 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Debug</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>API_BASE: <code>{API_BASE}</code></li>
          <li>Org header: <code>x-org-id: {ORG_ID}</code></li>
          <li>Token present: <code>{token ? 'yes' : 'no'}</code></li>
        </ul>
      </div>
    </div>
  );
}