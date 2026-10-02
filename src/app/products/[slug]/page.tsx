import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/ProductPurchase";
import { formatMoney } from "@/lib/money";
import { getProductByIdOrSlug } from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductByIdOrSlug(slug);
  return { title: product?.name ?? "Product not found" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductByIdOrSlug(slug);

  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-muted transition-colors hover:text-ink"
      >
        &larr; Back
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-surface">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-6xl font-extrabold text-muted-soft">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="rounded-[2rem] bg-surface p-7 sm:p-9">
          {product.category ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {product.category}
            </span>
          ) : null}

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="price-pill bg-butter px-5 py-2.5 text-base">
              {formatMoney(product.price_cents, product.currency)}
            </span>
            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                inStock ? "bg-mint text-ink" : "bg-blush text-ink"
              }`}
            >
              {inStock ? `In stock · ${product.stock} left` : "Out of stock"}
            </span>
          </div>

          {product.description ? (
            <p className="mt-5 text-sm font-medium leading-relaxed text-muted">
              {product.description}
            </p>
          ) : null}

          <div className="mt-7">
            <ProductPurchase product={product} />
          </div>

          <p className="mt-4 text-center text-xs font-semibold text-muted">
            Free delivery on orders over $50.
          </p>
        </div>
      </div>
    </div>
  );
}