// apps/web/components/AddProductModal.tsx
'use client';

import type { ProductStatus, ProductType } from '@/lib/api';
import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    sku: string;
    price: number;
    type: ProductType;
    status?: ProductStatus;
    description?: string | null;
  }) => Promise<void>;
};

export default function AddProductModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<string>('0');
  const [type, setType] = useState<ProductType>('PHYSICAL');
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [description, setDescription] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onCreate({
        title: title.trim(),
        sku: sku.trim(),
        price: Number(price),
        type,
        status,
        description: description.trim() || null,
      });
      // reset and close
      setTitle('');
      setSku('');
      setPrice('0');
      setType('PHYSICAL');
      setStatus('ACTIVE');
      setDescription('');
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to create product');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Product</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Esc
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Title</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700">SKU</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Price</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Type</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
              >
                <option value="PHYSICAL">PHYSICAL</option>
                <option value="DIGITAL">DIGITAL</option>
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700">Status</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium text-gray-700">Description (optional)</span>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>
          </div>

          {err && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {busy ? 'Creating…' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}