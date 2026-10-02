"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/types";

/**
 * Adds a product to the cart.
 * - `icon`  → circular button (used on product cards)
 * - `pill`  → "Add to cart" pill with a trailing circular icon (used on the detail page)
 * - `dark`  → the moodboard's black "Add To Cart" bar
 */
export function AddToCartButton({
  product,
  variant = "icon",
}: {
  product: Product;
  variant?: "icon" | "pill" | "dark";
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  function handleClick() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  const basketIcon = (
    <svg
      width="18"
      height="18"
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
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={soldOut}
        aria-label={soldOut ? "Sold out" : `Add ${product.name} to cart`}
        title={soldOut ? "Sold out" : "Add to cart"}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 ${
          added ? "bg-ink text-butter" : "bg-butter text-ink"
        }`}
      >
        {added ? (
          <svg
            width="18"
            height="18"
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
          basketIcon
        )}
      </button>
    );
  }

  if (variant === "dark") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={soldOut}
        className="flex w-full items-center justify-between rounded-full bg-ink py-2 pl-7 pr-2 text-sm font-bold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-45"
      >
        {soldOut ? "Sold out" : added ? "Added to cart" : "Add To Cart"}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-butter text-ink">
          {basketIcon}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={soldOut}
      className="inline-flex items-center gap-3 rounded-full bg-butter py-2 pl-7 pr-2 text-sm font-bold text-ink transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {soldOut ? "Sold out" : added ? "Added" : "Add to cart"}
      <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-butter">
        {basketIcon}
      </span>
    </button>
  );
}