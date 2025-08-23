// apps/web/app/catalog/[id]/page.tsx
type Product = {
  id: string;
  orgId: string;
  title: string;
  type: 'physical' | 'digital' | 'service' | string;
  description?: string | null;
  createdAt: string;
};

export const dynamic = 'force-dynamic'; // always fetch fresh data

export default async function ProductDetail({ params }: { params: { id: string } }) {
  // Use Next.js rewrite proxy instead of a hardcoded API URL
  const API = '/api';
  const ORG = process.env.NEXT_PUBLIC_ORG_ID!;

  const res = await fetch(`${API}/products/${params.id}`, {
    headers: { 'x-org': ORG },
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="max-w-2xl p-6">
        <a className="underline" href="/catalog">
          ← Back to Catalog
        </a>
        <h1 className="mt-3 text-xl font-semibold">Product not found</h1>
      </div>
    );
  }

  const p = (await res.json()) as Product;

  return (
    <div className="max-w-2xl space-y-3 p-6">
      <a className="underline" href="/catalog">
        ← Back to Catalog
      </a>

      <h1 className="text-3xl font-semibold">{p.title}</h1>
      <div className="opacity-70">{p.type}</div>

      <p className="mt-2">{p.description?.trim() || 'No description'}</p>

      <div className="text-sm opacity-70">Created: {new Date(p.createdAt).toLocaleString()}</div>

      <div className="pt-2">
        <a href={`/catalog/${p.id}/edit`} className="inline-block rounded border px-3 py-2">
          Edit
        </a>
      </div>
    </div>
  );
}
