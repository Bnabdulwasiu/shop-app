"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney, FREE_SHIPPING_THRESHOLD_CENTS, shippingForSubtotal } from "@/lib/money";

export function CartView() {
  const { items, count, subtotalCents, ready, setQuantity, removeItem, clear } = useCart();

  const currency = items[0]?.currency ?? "USD";
  const shippingCents = shippingForSubtotal(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  if (!ready) {
    return <p className="py-16 text-center text-sm font-semibold text-muted">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-surface px-8 py-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-butter">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#17171a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8h18l-1.6 9.6a2 2 0 0 1-2 1.4H6.6a2 2 0 0 1-2-1.4L3 8Z" />
            <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
          </svg>
        </span>
        <h2 className="mt-5 text-xl font-extrabold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted">
          Add a few snacks and they&rsquo;ll show up here.
        </p>
        <Link href="/" className="btn-ink mt-7">
          Browse products
        </Link>
      </div>
    );
  }

  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center gap-3 rounded-3xl bg-surface p-3 sm:gap-4"
          >
            <Link
              href={`/products/${item.slug}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-canvas"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : null}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="block truncate text-[15px] font-bold transition-opacity hover:opacity-70"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {formatMoney(item.priceCents, item.currency)} each
              </p>
              <span className="price-pill mt-2 bg-butter sm:hidden">
                {formatMoney(item.priceCents * item.quantity, item.currency)}
              </span>
            </div>

            <div className="stepper shrink-0">
              <button
                type="button"
                aria-label={`Decrease ${item.name} quantity`}
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface text-lg font-bold leading-none transition-colors hover:bg-white"
              >
                &minus;
              </button>
              <span className="w-7 text-center text-sm font-extrabold">{item.quantity}</span>
              <button
                type="button"
                aria-label={`Increase ${item.name} quantity`}
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface text-lg font-bold leading-none transition-colors hover:bg-white"
              >
                +
              </button>
            </div>

            <span className="price-pill hidden bg-butter sm:inline-flex">
              {formatMoney(item.priceCents * item.quantity, item.currency)}
            </span>

            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              title="Remove"
              onClick={() => removeItem(item.productId)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-[#f1f1f3] hover:text-ink"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <aside className="panel-ink h-fit p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Cart</h2>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-butter text-sm font-extrabold text-ink">
            {count}
          </span>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-white/60">Subtotal</dt>
            <dd className="font-semibold">{formatMoney(subtotalCents, currency)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-white/60">Delivery Amount</dt>
            <dd className="font-semibold">
              {shippingCents === 0 ? "Free" : formatMoney(shippingCents, currency)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-3xl bg-butter p-5 text-ink">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/55">
            Total Amount
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">
            {formatMoney(totalCents, currency)}
          </p>
          {remainingForFreeShipping > 0 ? (
            <p className="mt-2 text-xs font-semibold text-ink/60">
              Add {formatMoney(remainingForFreeShipping, currency)} more for free delivery.
            </p>
          ) : null}
        </div>

        <Link
          href="/checkout"
          className="mt-5 flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-[1.02]"
        >
          Checkout
        </Link>

        <button
          type="button"
          onClick={clear}
          className="mt-4 w-full text-center text-xs font-semibold text-white/45 transition-colors hover:text-white"
        >
          Clear cart
        </button>
      </aside>
    </div>
  );
}