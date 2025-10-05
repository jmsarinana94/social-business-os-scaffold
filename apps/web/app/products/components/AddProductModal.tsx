// apps/web/app/products/components/AddProductModal.tsx
'use client';

import { createProduct } from '@/lib/api';
import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (p: any) => void;
};

type ProductType = 'PHYSICAL' | 'DIGITAL' | 'GIFT_CARD';
type ProductStatus = 'ACTIVE' | 'DRAFT';

export default function AddProductModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('0');
  const [type, setType] = useState<ProductType>('PHYSICAL');
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [inventoryQty, setInventoryQty] = useState('0');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const titleNorm = title.trim();
    const skuNorm = sku.trim();
    const priceNum = Number(price);
    const invNum = Number(inventoryQty);

    // Basic validation (sku is required per API typing)
    if (!titleNorm) return setErr('Title is required.');
    if (!skuNorm) return setErr('SKU is required.');
    if (!Number.isFinite(priceNum) || priceNum < 0) return setErr('Price must be a non-negative number.');
    if (!Number.isInteger(invNum) || invNum < 0) return setErr('Inventory qty must be a non-negative integer.');

    try {
      setSubmitting(true);

      // NOTE: sku is always a string now (no undefined), fixing the TS error
      const created = await createProduct({
        title: titleNorm,
        sku: skuNorm,
        price: priceNum,
        type,
        status,
        inventoryQty: invNum,
      } as any);

      onCreated?.(created);

      // reset and close
      setTitle('');
      setSku('');
      setPrice('0');
      setType('PHYSICAL');
      setStatus('ACTIVE');
      setInventoryQty('0');
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Product</h2>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </div>

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Title *</span>
              <input
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blue Mug"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">SKU *</span>
              <input
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="MUG-BLUE"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Price (USD)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12.00"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Inventory Qty</span>
              <input
                type="number"
                step="1"
                min="0"
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                value={inventoryQty}
                onChange={(e) => setInventoryQty(e.target.value)}
                placeholder="0"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Type</span>
              <select
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
              >
                <option value="PHYSICAL">PHYSICAL</option>
                <option value="DIGITAL">DIGITAL</option>
                <option value="GIFT_CARD">GIFT_CARD</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Status</span>
              <select
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}