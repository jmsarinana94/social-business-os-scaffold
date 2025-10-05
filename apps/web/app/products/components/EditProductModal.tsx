'use client';

import { getProduct, Product, ProductStatus, ProductType, updateProduct } from '@/lib/api';
import { useEffect, useState } from 'react';

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditProductModal({ id, open, onClose, onUpdated }: Props) {
  const [model, setModel] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setErr(null);
        setBusy(true);
        const p = await getProduct(id);
        setModel(p);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load product');
      } finally {
        setBusy(false);
      }
    }
    if (open && id) load();
  }, [open, id]);

  if (!open) return null;

  function patch<K extends keyof Product>(key: K, val: Product[K]) {
    if (!model) return;
    setModel({ ...model, [key]: val });
  }

  async function save() {
    if (!model) return;
    if (!model.title.trim()) return setErr('Title is required');
    try {
      setBusy(true);
      await updateProduct(model.id, {
        title: model.title.trim(),
        sku: model.sku?.trim() || undefined,
        price: Number(model.price) || 0,
        type: model.type as ProductType,
        status: model.status as ProductStatus,
        description: model.description?.trim() || undefined,
      });
      onUpdated?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Failed to update product');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Product</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Esc</button>
        </div>

        {!model ? (
          <div className="py-8 text-center text-gray-500">{busy ? 'Loading…' : (err || 'Not found')}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500">Title</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={model.title} onChange={(e) => patch('title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">SKU</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={model.sku ?? ''} onChange={(e) => patch('sku', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-gray-500">Price</label>
                <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={model.price} onChange={(e) => patch('price', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Type</label>
                <select className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={model.type} onChange={(e) => patch('type', e.target.value as ProductType)}>
                  <option value="PHYSICAL">PHYSICAL</option>
                  <option value="DIGITAL">DIGITAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500">Status</label>
                <select className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={model.status} onChange={(e) => patch('status', e.target.value as ProductStatus)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500">Description</label>
                <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3}
                  value={model.description ?? ''} onChange={(e) => patch('description', e.target.value)} />
              </div>
            </div>

            {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border px-3 py-2">Cancel</button>
              <button onClick={save} disabled={busy} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}