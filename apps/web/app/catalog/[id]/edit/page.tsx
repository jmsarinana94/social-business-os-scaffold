'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

type Product = {
  id: string;
  title: string;
  type: 'physical' | 'digital' | 'service';
  description?: string | null;
  price?: number; // cents
  sku?: string | null;
  inventoryQty?: number;
  status?: 'active' | 'archived';
};

// Use the rewrite proxy instead of a hardcoded API URL
const API = '/api';
const ORG = process.env.NEXT_PUBLIC_ORG_ID!;
if (!ORG) {
  // Helpful runtime guard in dev

  console.warn('Missing NEXT_PUBLIC_ORG_ID');
}

async function fetchOne(id: string): Promise<Product> {
  const res = await fetch(`${API}/products/${id}`, {
    headers: { 'x-org': ORG },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load product');
  return res.json();
}

export default function EditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{
    title: string;
    type: Product['type'];
    description: string;
    priceDollars: string; // UI in dollars, convert to cents on save
    sku: string;
    inventoryQty: string;
    status: 'active' | 'archived';
  }>({
    title: '',
    type: 'physical',
    description: '',
    priceDollars: '',
    sku: '',
    inventoryQty: '0',
    status: 'active',
  });

  useEffect(() => {
    let mounted = true;
    fetchOne(id)
      .then((p) => {
        if (!mounted) return;
        setForm({
          title: p.title,
          type: p.type,
          description: p.description ?? '',
          priceDollars: p.price != null ? (p.price / 100).toFixed(2) : '',
          sku: p.sku ?? '',
          inventoryQty: String(p.inventoryQty ?? 0),
          status: (p.status as 'active' | 'archived') ?? 'active',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const dollars = parseFloat(form.priceDollars.replace(/[^0-9.]/g, ''));
    const cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;

    const qtyNum = Number(form.inventoryQty.replace(/[^0-9-]/g, ''));
    const qty = Number.isFinite(qtyNum) ? qtyNum : 0;

    await fetch(`${API}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-org': ORG },
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        description: form.description || null,
        price: cents,
        sku: form.sku || undefined, // let DB default if empty
        inventoryQty: qty,
        status: form.status,
      }),
    });

    // bounce back to the catalog and force a refresh
    window.location.href = `/catalog?ts=${Date.now()}`;
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div className="max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            className="w-full rounded border p-2"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            className="w-full rounded border p-2"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Product['type'] }))}
          >
            <option value="physical">physical</option>
            <option value="digital">digital</option>
            <option value="service">service</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            id="description"
            className="w-full rounded border p-2"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="price" className="block text-sm font-medium">
              Price (USD)
            </label>
            <input
              id="price"
              className="w-full rounded border p-2"
              inputMode="decimal"
              value={form.priceDollars}
              onChange={(e) => setForm((f) => ({ ...f, priceDollars: e.target.value }))}
              placeholder="e.g. 19.99"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="inventory" className="block text-sm font-medium">
              Inventory Qty
            </label>
            <input
              id="inventory"
              className="w-full rounded border p-2"
              inputMode="numeric"
              value={form.inventoryQty}
              onChange={(e) => setForm((f) => ({ ...f, inventoryQty: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              className="w-full rounded border p-2"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as 'active' | 'archived' }))
              }
            >
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="sku" className="block text-sm font-medium">
              SKU (optional)
            </label>
            <input
              id="sku"
              className="w-full rounded border p-2"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="auto if left blank"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="rounded border px-4 py-2">
            Save
          </button>
          <a href="/catalog" className="underline">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
