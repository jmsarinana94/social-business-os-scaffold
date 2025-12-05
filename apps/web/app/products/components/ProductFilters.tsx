'use client';

import { ProductStatus, ProductType } from '@/lib/api';

type Props = {
  q: string;
  setQ: (v: string) => void;
  type: ProductType | 'ALL';
  setType: (v: ProductType | 'ALL') => void;
  status: ProductStatus | 'ALL';
  setStatus: (v: ProductStatus | 'ALL') => void;
  sort: 'title' | 'price' | 'inventory';
  setSort: (v: 'title' | 'price' | 'inventory') => void;
  order: 'asc' | 'desc';
  setOrder: (v: 'asc' | 'desc') => void;
  onRefresh: () => void;
};

export default function ProductFilters({
  q,
  setQ,
  type,
  setType,
  status,
  setStatus,
  sort,
  setSort,
  order,
  setOrder,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="product-filter-search" className="block text-xs text-gray-500">
          Search
        </label>
        <input
          id="product-filter-search"
          className="mt-1 rounded-lg border px-3 py-2"
          placeholder="Title, SKU…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="product-filter-type" className="block text-xs text-gray-500">
          Type
        </label>
        <select
          id="product-filter-type"
          className="mt-1 rounded-lg border px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as ProductType | 'ALL')}
        >
          <option value="ALL">All</option>
          <option value="PHYSICAL">Physical</option>
          <option value="DIGITAL">Digital</option>
        </select>
      </div>

      <div>
        <label htmlFor="product-filter-status" className="block text-xs text-gray-500">
          Status
        </label>
        <select
          id="product-filter-status"
          className="mt-1 rounded-lg border px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProductStatus | 'ALL')}
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="product-filter-sort" className="block text-xs text-gray-500">
          Sort
        </label>
        <select
          id="product-filter-sort"
          className="mt-1 rounded-lg border px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value as 'title' | 'price' | 'inventory')}
        >
          <option value="title">Title</option>
          <option value="price">Price</option>
          <option value="inventory">Inventory</option>
        </select>
      </div>

      <div>
        <label htmlFor="product-filter-order" className="block text-xs text-gray-500">
          Order
        </label>
        <select
          id="product-filter-order"
          className="mt-1 rounded-lg border px-3 py-2"
          value={order}
          onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="rounded-lg border px-3 py-2"
      >
        Apply
      </button>
    </div>
  );
}