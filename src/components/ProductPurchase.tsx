"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

/**
 * Quantity stepper + total pill + "Add To Cart" bar — the moodboard's product screen.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock <= 0;
  const maxQuantity = Math.max(1, Math.min(product.stock, 99));
  const totalCents = product.price_cents * quantity;

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-8 rounded-full bg-canvas px-6 py-4">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={soldOut || quantity <= 1}
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          className="grid h-11 w-11 place-items-center rounded-full bg-surface text-xl font-bold leading-none transition-colors hover:bg-white disabled:opacity-40"
        >
          &minus;
        </button>

        <span className="min-w-12 text-center text-3xl font-extrabold tabular-nums">
          {String(quantity).padStart(2, "0")}
        </span>

        <button
          type="button"
          aria-label="Increase quantity"
          disabled={soldOut || quantity >= maxQuantity}
          onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
          className="grid h-11 w-11 place-items-center rounded-full bg-surface text-xl font-bold leading-none transition-colors hover:bg-white disabled:opacity-40"
        >
          +
        </button>
      </div>

      <div className="flex justify-center">
        <span className="price-pill bg-butter px-6 py-3 text-base">
          {formatMoney(totalCents, product.currency)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={soldOut}
        className="flex w-full items-center justify-between rounded-full bg-ink py-2.5 pl-8 pr-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-45"
      >
        {soldOut ? "Sold out" : added ? "Added to cart" : "Add To Cart"}
        <span className="grid h-11 w-11 place-items-center rounded-full bg-butter text-ink">
          {added ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8h18l-1.6 9.6a2 2 0 0 1-2 1.4H6.6a2 2 0 0 1-2-1.4L3 8Z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}