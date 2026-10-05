// Shared types — mirror of web `src/lib/types.ts` (camelCase client shape).
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  active: boolean;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
};

/** Format kobo as Naira (matches web `formatMoney`). */
export function formatMoney(cents: number, currency = "NGN"): string {
  const naira = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(naira);
  } catch {
    return `₦${Math.round(naira).toLocaleString("en-NG")}`;
  }
}

export const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "") ||
  "https://shop-app-kappa-coral.vercel.app";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
