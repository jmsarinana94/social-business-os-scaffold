'use client';

import {
  getOrder,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'];

function formatCents(cents: number | undefined) {
  const n = Number.isFinite(cents) ? Number(cents) : 0;
  return (n / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load order
  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getOrder(String(id));
        if (active) setOrder(data);
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load order');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const createdAtStr = useMemo(() => {
    if (!order?.createdAt) return '';
    const d = new Date(order.createdAt);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }, [order?.createdAt]);

  // Subtotal derived from items (price in cents * qty)
  const subtotalCents = useMemo(() => {
    if (!order?.items?.length) return 0;
    return order.items.reduce((acc, it) => {
      const price = Number(it?.price ?? 0);
      const qty = Number(it?.quantity ?? 0);
      return acc + price * qty;
    }, 0);
  }, [order?.items]);

  const totalCents = useMemo(() => {
    // If API provides total, prefer it; else fall back to subtotal
    const provided = Number(order?.total ?? NaN);
    return Number.isFinite(provided) ? provided : subtotalCents;
  }, [order?.total, subtotalCents]);

  async function onChangeStatus(next: OrderStatus) {
    if (!order) return;
    try {
      setSaving(true);
      const updated = await updateOrderStatus(order.id, next);
      setOrder(updated);
    } catch (e: any) {
      alert(e?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="rounded-xl border bg-white p-6 shadow-sm text-center">
          <div className="text-red-600 font-semibold mb-2">Unable to load order</div>
          <div className="text-sm text-slate-600 mb-4">{error || 'Unknown error'}</div>
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            {createdAtStr && (
              <div className="text-sm text-gray-500">{createdAtStr}</div>
            )}
            <h1 className="text-xl font-semibold">Order {order.id}</h1>
            {order.customerEmail && (
              <div className="text-sm text-gray-600">{order.customerEmail}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border bg-white px-3 py-2"
              value={order.status}
              onChange={(e) => onChangeStatus(e.target.value as OrderStatus)}
              disabled={saving}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              className="px-3 py-2 rounded-lg border"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Product</th>
                <th className="text-left px-4 py-2">SKU</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-right px-4 py-2">Price</th>
                <th className="text-right px-4 py-2">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, idx) => {
                const qty = Number(it.quantity ?? 0);
                const price = Number(it.price ?? 0);
                const line = qty * price;
                return (
                  <tr key={`${it.productId}-${idx}`} className="border-t">
                    <td className="px-4 py-2">{it.product?.title || it.productId}</td>
                    <td className="px-4 py-2 text-slate-600">{it.product?.sku || '-'}</td>
                    <td className="px-4 py-2 text-right">{qty}</td>
                    <td className="px-4 py-2 text-right">{formatCents(price)}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCents(line)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t bg-slate-50">
                <td className="px-4 py-3" colSpan={4}>
                  Subtotal
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCents(subtotalCents)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3" colSpan={4}>
                  Total
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCents(totalCents)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60"
            onClick={() => router.push('/orders')}
            disabled={saving}
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
}