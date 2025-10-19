'use client';

/**
 * Thin API client used by client components.
 * It handles:
 *  - base URL + org header
 *  - auth token storage (localStorage)
 *  - typed helpers for products & orders
 */

// ---------- Env & constants ----------
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:4001/v1';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'org_demo';

const TOKEN_KEY = 'access_token';

// ---------- Token helpers ----------
let inMemoryToken: string | null = null;

export function setToken(token: string | null) {
  inMemoryToken = token;
  try {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore localStorage errors */
  }
}

export function getToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    if (typeof window !== 'undefined') {
      inMemoryToken = localStorage.getItem(TOKEN_KEY);
      return inMemoryToken;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearToken() {
  setToken(null);
}

// ---------- HTTP helper ----------
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  path: string,
  opts: {
    method?: HttpMethod;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
    noAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', query, body, headers = {}, noAuth = false } = opts;

  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const token = getToken();

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'content-type': 'application/json',
      'x-org-id': ORG_ID,
      ...(token && !noAuth ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Try to parse JSON either way for better errors
  const text = await res.text();
  let data: any = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    /* non-JSON response, keep raw */
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return data as T;
}

// ---------- Types ----------
export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'GIFT_CARD';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type Product = {
  id: string;
  orgId: string;
  sku?: string | null;
  title: string;
  description?: string | null;
  type: ProductType;
  status: ProductStatus;
  price: number;
  inventoryQty?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED';

export type Order = {
  id: string;
  status: OrderStatus;
  total?: number | null;
  customerEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
    product?: Pick<Product, 'id' | 'title' | 'sku'>;
  }>;
};

// ---------- Auth ----------
export async function login(params: { email: string; password: string; org?: string }) {
  const { email, password, org } = params;
  const data = await request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password, org: org || ORG_ID },
    noAuth: true,
  });
  setToken(data.access_token);
  return data;
}

export async function me() {
  return request<{ id: string; email: string }>('/auth/me', { method: 'GET' });
}

// ---------- Products ----------
export async function listProducts(params?: {
  limit?: number;
  q?: string;
  status?: ProductStatus;
}) {
  const { limit = 50, q, status } = params || {};
  return request<Product[]>('/products', {
    method: 'GET',
    query: { limit, q, status },
  });
}

// keep both names to satisfy various components
export async function getProductById(id: string) {
  return request<Product>(`/products/${encodeURIComponent(id)}`, { method: 'GET' });
}
export const getProduct = getProductById;

export async function createProduct(input: {
  title: string;
  sku?: string;
  price: number;
  type: ProductType;
  status: ProductStatus;
  description?: string;
  inventoryQty?: number;
}) {
  return request<Product>('/products', {
    method: 'POST',
    body: input,
  });
}

export async function updateProduct(
  id: string,
  input: Partial<{
    title: string;
    sku?: string | null;
    price: number;
    type: ProductType;
    status: ProductStatus;
    description?: string | null;
    inventoryQty?: number | null;
  }>
) {
  return request<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: input,
  });
}

export async function deleteProduct(id: string) {
  return request<{ ok: true }>(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ---------- Orders ----------
export async function listOrders(params?: {
  limit?: number;
  q?: string;
  status?: OrderStatus;
}) {
  const { limit = 50, q, status } = params || {};
  return request<Order[]>('/orders', {
    method: 'GET',
    query: { limit, q, status },
  });
}

export async function getOrder(id: string) {
  return request<Order>(`/orders/${encodeURIComponent(id)}`, { method: 'GET' });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return request<Order>(`/orders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { status },
  });
}