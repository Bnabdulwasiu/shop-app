"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product } from "@/lib/types";

const STORAGE_KEY = "shop_cart_v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.priceCents === "number" &&
    typeof item.quantity === "number"
  );
}

function readLocal(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode) - ignore */
  }
}

/** Combine two carts, summing quantities for matching products. */
function mergeItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    const existing = map.get(item.productId);
    if (existing) {
      map.set(item.productId, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      map.set(item.productId, { ...item });
    }
  }
  return [...map.values()];
}

function saveToServer(items: CartItem[]) {
  return fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).catch(() => undefined);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initial load: hydrate from localStorage and, when signed in, merge the DB cart.
  useEffect(() => {
    let active = true;

    async function load() {
      const local = readLocal();
      let currentUserId: string | null = null;

      if (isSupabaseConfigured) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          currentUserId = user?.id ?? null;
        } catch {
          currentUserId = null;
        }
      }

      if (!active) return;
      setUserId(currentUserId);

      if (currentUserId) {
        try {
          const res = await fetch("/api/cart", { cache: "no-store" });
          if (res.ok) {
            const payload = (await res.json()) as { items?: CartItem[] };
            const merged = mergeItems(payload.items ?? [], local);
            if (!active) return;
            setItems(merged);
            await saveToServer(merged);
            setReady(true);
            return;
          }
        } catch {
          /* fall through to local cart */
        }
      }

      if (!active) return;
      setItems(local);
      setReady(true);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  // Persist on every change (localStorage always, DB when signed in).
  useEffect(() => {
    if (!ready) return;
    writeLocal(items);
    if (userId) void saveToServer(items);
  }, [items, ready, userId]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          priceCents: product.price_cents,
          currency: product.currency,
          imageUrl: product.image_url,
          quantity,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const subtotalCents = items.reduce(
      (total, item) => total + item.priceCents * item.quantity,
      0
    );
    return { items, count, subtotalCents, ready, addItem, setQuantity, removeItem, clear };
  }, [items, ready, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return context;
}
