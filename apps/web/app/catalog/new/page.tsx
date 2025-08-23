'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type ProductType = 'physical' | 'digital' | 'service';
type ProductStatus = 'active' | 'archived';

// Use the rewrite proxy instead of a hardcoded API URL
const API = '/api';
const ORG = process.env.NEXT_PUBLIC_ORG_ID!;
if (!ORG) {
  console.warn('Missing NEXT_PUBLIC_ORG_ID');
}

export default function NewProductPage() {
  const [form, setForm] = useState<{
    title: string;
    type: ProductType;
    description: string;
    priceDollars: string;
    sku: string;
    inventoryQty: string;
    status: ProductStatus;
  }>({
    title: '',
    type: 'physical',
    description: '',
    priceDollars: '',
    sku: '',
    inventoryQty: '0',
    status: 'active',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dollars = parseFloat(form.priceDollars.replace(/[^0-9.]/g, ''));
    const cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;

    const qtyNum = Number(form.inventoryQty.replace(/[^0-9-]/g, ''));
    const qty = Number.isFinite(qtyNum) ? qtyNum : 0;

    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org': ORG },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          description: form.description || null, // optional
          price: cents, // cents
          sku: form.sku || undefined, // let the API/DB default if empty
          inventoryQty: qty,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create product');
      }
      // back to catalog, forcing a refresh
      window.location.href = `/catalog?ts=${Date.now()}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4 p-6">
      <a className="underline" href="/catalog">
        ← Back to Catalog
      </a>
      <h1 className="text-2xl font-semibold">New product</h1>

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
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductType }))}
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
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}
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

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded border px-4 py-2 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <a href="/catalog" className="underline">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
