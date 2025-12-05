'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { listOrders, Order, OrderStatus } from '@/lib/api';

const STATUS_OPTIONS: Array<OrderStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'PAID',
  'FULFILLED',
  'CANCELLED',
];

function formatCents(cents?: number) {
  const v = Number.isFinite(cents) ? Number(cents) : 0;
  return (v / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        // listOrders() in this scaffold does not take params; we filter client-side
        const data = await listOrders();
        if (active) setOrders(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (orders || []).filter((o) => {
      const statusOk = status === 'ALL' ? true : o.status === status;

      // Safely gather optional fields
      const hayParts: Array<string | undefined> = [
        o.id,
        (o as any)?.customerEmail,
        (o as any)?.customerName,
      ];
      const hay = hayParts
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
        .join(' • ');

      const textOk = needle ? hay.includes(needle) : true;
      return statusOk && textOk;
    });
  }, [orders, status, q]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Orders</h1>
          <div className="flex gap-2">
            <select
              className="rounded-lg border bg-white px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | 'ALL')}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by id / email / name"
              className="rounded-lg border bg-white px-3 py-2 w-72"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Order ID</th>
                <th className="text-left px-4 py-2">Customer</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const created =
                    o.createdAt && !Number.isNaN(new Date(o.createdAt).getTime())
                      ? new Date(o.createdAt).toLocaleString()
                      : '';
                  // Prefer API-provided total; else derive from items
                  const items = (o as any)?.items as
                    | Array<{ price?: number; quantity?: number }>
                    | undefined;
                  const derivedTotal =
                    items?.reduce(
                      (acc, it) => acc + Number(it?.price ?? 0) * Number(it?.quantity ?? 0),
                      0,
                    ) ?? 0;
                  const totalCents = Number.isFinite((o as any)?.total)
                    ? Number((o as any).total)
                    : derivedTotal;

                  const customer =
                    (o as any)?.customerEmail ||
                    (o as any)?.customerName ||
                    (o as any)?.customerId ||
                    '—';

                  return (
                    <tr
                      key={o.id}
                      className="border-t hover:bg-slate-50 cursor-pointer"
                      onClick={() => router.push(`/orders/${o.id}`)}
                    >
                      <td className="px-4 py-2">{created}</td>
                      <td className="px-4 py-2 font-mono">{o.id}</td>
                      <td className="px-4 py-2">{customer}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCents(totalCents)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}