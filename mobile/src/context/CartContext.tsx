import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "../lib/supabase";
import { fetchCart, saveCart } from "../lib/api";
import { isConfigured, type CartItem, type Product } from "../lib/types";
import { useAuth } from "./AuthContext";

type CartState = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  syncing: boolean;
  lastSync: string | null;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave = useRef(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setReady(true);
      return;
    }
    setSyncing(true);
    try {
      const server = await fetchCart(accessToken);
      skipSave.current = true;
      setItems(server);
      setLastSync(new Date().toLocaleTimeString());
    } catch {
      /* offline — keep current items */
    } finally {
      setSyncing(false);
      setReady(true);
    }
  }, [accessToken]);

  // Initial load on login.
  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  // Push local edits to the server (debounced) — mirrors web CartProvider.
  useEffect(() => {
    if (!ready || !accessToken) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveCart(accessToken, items).then((ok) => {
        if (ok) setLastSync(new Date().toLocaleTimeString());
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [items, ready, accessToken]);

  // INSTANT SYNC: subscribe to this user's cart rows. When the website adds an
  // item, Postgres notifies us and we refetch within ~1s — no pull-to-refresh.
  useEffect(() => {
    if (!ready || !user || !isConfigured) return;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const pull = async () => {
      if (cancelled || !accessToken) return;
      try {
        const server = await fetchCart(accessToken);
        skipSave.current = true;
        setItems((prev) =>
          JSON.stringify(prev) === JSON.stringify(server) ? prev : server
        );
        setLastSync(new Date().toLocaleTimeString());
      } catch {
        /* offline */
      }
    };

    try {
      const supabase = getSupabase();
      const channel = supabase
        .channel(`cart:${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cart_items" },
          () => void pull()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "carts" },
          () => void pull()
        )
        .subscribe();
      poll = setInterval(() => void pull(), 15000);
      return () => {
        cancelled = true;
        if (poll) clearInterval(poll);
        void supabase.removeChannel(channel);
      };
    } catch {
      poll = setInterval(() => void pull(), 15000);
      return () => {
        cancelled = true;
        if (poll) clearInterval(poll);
      };
    }
  }, [ready, user, accessToken]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
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
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartState>(() => {
    const count = items.reduce((t, i) => t + i.quantity, 0);
    const subtotalCents = items.reduce((t, i) => t + i.priceCents * i.quantity, 0);
    return {
      items,
      count,
      subtotalCents,
      ready,
      syncing,
      lastSync,
      addItem,
      setQuantity,
      removeItem,
      clear,
      refresh,
    };
  }, [items, ready, syncing, lastSync, addItem, setQuantity, removeItem, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
