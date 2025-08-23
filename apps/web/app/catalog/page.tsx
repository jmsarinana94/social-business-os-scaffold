// apps/web/app/catalog/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: string;
  orgId: string;
  title: string;
  type: 'physical' | 'digital' | 'service' | string;
  description?: string | null;
  createdAt: string;
};

// Hit the Next.js rewrite proxy
const API = '/api';
const ORG = process.env.NEXT_PUBLIC_ORG_ID!;

export default function CatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products`, {
        headers: { 'x-org': ORG },
        cache: 'no-store',
      });
      const data = (await res.json()) as Product[];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    const ok = confirm('Delete this product?');
    if (!ok) return;
    await fetch(`${API}/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-org': ORG },
    });
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <a className="rounded border px-3 py-2" href="/catalog/new">
          + New product
        </a>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="opacity-70">
          No products yet. Click <span className="font-medium">“+ New product”</span> to add one.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <a className="text-lg underline" href={`/catalog/${p.id}`}>
                    {p.title}
                  </a>
                  <div className="text-sm opacity-70">
                    {p.type} • {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a className="rounded border px-3 py-1" href={`/catalog/${p.id}/edit`}>
                    Edit
                  </a>
                  <button className="rounded border px-3 py-1" onClick={() => onDelete(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
              {p.description && <p className="mt-2 opacity-90">{p.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
