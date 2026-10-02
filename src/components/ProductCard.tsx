import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <article className="group flex flex-col rounded-3xl bg-surface p-3 transition-shadow duration-300 hover:shadow-[0_18px_40px_-20px_rgba(23,23,26,0.35)]">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-canvas"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-4xl font-extrabold text-muted-soft">
            {product.name.charAt(0)}
          </span>
        )}

        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-butter">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        {product.category ? (
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {product.category}
          </span>
        ) : null}

        <Link
          href={`/products/${product.slug}`}
          className="mt-1 text-[15px] font-bold leading-snug transition-opacity hover:opacity-70"
        >
          {product.name}
        </Link>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="price-pill bg-butter">
            {formatMoney(product.price_cents, product.currency)}
          </span>
          <AddToCartButton product={product} variant="icon" />
        </div>
      </div>
    </article>
  );
}