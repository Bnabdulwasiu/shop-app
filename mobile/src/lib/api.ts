// API layer — calls the SAME Next.js endpoints the website uses.
// Auth: `Authorization: Bearer <supabase_access_token>` (see web `api-auth.ts`).
import { API_URL, type CartItem, type Product } from "./types";

function authHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** GET /api/products — public catalogue feed. */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Products request failed (${res.status})`);
  const payload = (await res.json()) as { products?: Product[] };
  return payload.products ?? [];
}

/** GET /api/cart — persisted cart for the signed-in user. */
export async function fetchCart(token: string | null): Promise<CartItem[]> {
  if (!token) return [];
  const res = await fetch(`${API_URL}/api/cart`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Cart request failed (${res.status})`);
  const payload = (await res.json()) as { items?: CartItem[] };
  return payload.items ?? [];
}

/** PUT /api/cart — replace the persisted cart (same contract as the web). */
export async function saveCart(token: string | null, items: CartItem[]): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/api/cart`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return false;
    const payload = (await res.json()) as { persisted?: boolean };
    return payload.persisted !== false;
  } catch {
    return false;
  }
}

/** POST /api/checkout — same validation + re-pricing as the website. */
export async function placeOrder(
  token: string | null,
  input: {
    items: { productId: string; quantity: number }[];
    customer: {
      full_name: string;
      email: string;
      phone?: string;
      shipping_address: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      notes?: string;
    };
  }
): Promise<{ ok: boolean; orderNumber?: string; error?: string; details?: string[] }> {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    orderNumber?: string;
    order_number?: string;
    error?: string;
    details?: string[];
  };
  if (!res.ok || !payload.ok) {
    return {
      ok: false,
      error: payload.error ?? `Checkout failed (${res.status})`,
      details: payload.details,
    };
  }
  return { ok: true, orderNumber: payload.orderNumber ?? payload.order_number };
}

/** GET /api/orders — order history for the signed-in user. */
export async function fetchOrders(token: string | null) {
  if (!token) return [];
  const res = await fetch(`${API_URL}/api/orders`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  const payload = (await res.json()) as { orders?: unknown[] };
  return (payload.orders ?? []) as Record<string, unknown>[];
}
