"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const ALL = "All";

/** Filter chips + product grid — the "All / Choco / …" row from the moodboard. */
export function ProductBrowser({ products }: { products: Product[] }) {
  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const product of products) {
      if (product.category) found.add(product.category);
    }
    return [ALL, ...Array.from(found).sort()];
  }, [products]);

  const [active, setActive] = useState<string>(ALL);

  const visible =
    active === ALL ? products : products.filter((product) => product.category === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {categories.map((category) => {
          const isActive = category === active;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(category)}
              className={isActive ? "chip-active" : "chip"}
            >
              {isActive && category !== ALL ? (
                <span className="h-1.5 w-1.5 rounded-full bg-butter" aria-hidden="true" />
              ) : null}
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface px-6 py-12 text-center text-sm font-semibold text-muted">
          Nothing in this collection yet.
        </p>
      ) : null}
    </div>
  );
}