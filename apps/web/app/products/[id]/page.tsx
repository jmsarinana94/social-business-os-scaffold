'use client';

import {
  deleteProduct,
  getProductById,
  updateProduct,
  type Product
} from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Product>>({
    title: '',
    description: '',
    sku: '',
    price: 0,
    status: 'ACTIVE' as Product['status'],
    type: 'PHYSICAL' as Product['type'],
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await getProductById(id);
        if (!alive) return;
        setForm({
          title: data.title,
          description: data.description,
          sku: data.sku,
          price: data.price,
          status: data.status,
          type: data.type,
        });
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave() {
    try {
      setSaving(true);
      await updateProduct(id, {
        title: form.title!,
        description: form.description ?? '',
        sku: form.sku!,
        price: Number(form.price ?? 0),
        status: form.status!,
        type: form.type!,
      });
      router.push('/products');
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    try {
      setSaving(true);
      await deleteProduct(id);
      router.push('/products');
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">SKU</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.sku ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Price (¢)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.price ?? 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))
              }
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Status</span>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as Product['status'] }))
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Type</span>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as Product['type'] }))
              }
            >
              <option value="PHYSICAL">PHYSICAL</option>
              <option value="DIGITAL">DIGITAL</option>
              <option value="GIFT_CARD">GIFT_CARD</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onDelete}
          disabled={saving}
          className="rounded-lg border px-4 py-2 text-red-600 border-red-300 disabled:opacity-50"
        >
          {saving ? 'Please wait…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}