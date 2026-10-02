import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getOrderReceipt } from "@/lib/orders";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderFromQuery } = await searchParams;
  const cookieStore = await cookies();
  const cookieOrder = cookieStore.get("shop_last_order")?.value ?? null;

  // Only load full details using the order number we set as an httpOnly cookie
  // right after checkout, so orders can't be scraped by guessing numbers.
  const receipt = cookieOrder ? await getOrderReceipt(cookieOrder) : null;
  const orderNumber = receipt?.order_number ?? cookieOrder ?? orderFromQuery ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="rounded-[2rem] bg-surface p-8 sm:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-butter text-ink">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Thank you!
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
          Your order{orderNumber ? <> <strong className="text-ink">{orderNumber}</strong></> : null}{" "}
          has been placed. A confirmation email is on its way.
        </p>

        {receipt ? (
          <div className="mt-8 space-y-6">
            <p className="text-sm">
              {receipt.email_status === "sent" ? (
                <span className="rounded-full bg-mint px-4 py-2 font-bold text-ink">
                  Confirmation email sent to {receipt.email}
                </span>
              ) : (
                <span className="rounded-full bg-blush px-4 py-2 font-bold text-ink">
                  Email status: {receipt.email_status} ({receipt.email})
                </span>
              )}
            </p>

            <ul className="space-y-2">
              {(receipt.order_items ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-canvas px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate font-bold">
                    {item.name} &times; {item.quantity}
                  </span>
                  <span className="price-pill shrink-0 bg-butter">
                    {formatMoney(item.line_total_cents, receipt.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="panel-ink p-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Subtotal</dt>
                  <dd className="font-semibold">
                    {formatMoney(receipt.subtotal_cents, receipt.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Delivery Amount</dt>
                  <dd className="font-semibold">
                    {receipt.shipping_cents === 0
                      ? "Free"
                      : formatMoney(receipt.shipping_cents, receipt.currency)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-3xl bg-butter p-5 text-ink">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/55">
                  Total Amount
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">
                  {formatMoney(receipt.total_cents, receipt.currency)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-canvas p-5">
              <h2 className="text-sm font-extrabold">Shipping to</h2>
              <p className="mt-2 whitespace-pre-line text-sm font-medium text-muted">
                {[
                  receipt.full_name,
                  receipt.shipping_address,
                  [receipt.city, receipt.state, receipt.postal_code].filter(Boolean).join(", "),
                  receipt.country,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-canvas p-5 text-sm font-medium text-muted">
            We couldn&rsquo;t load the full receipt on this page, but your order was
            recorded. Sign in to view it under{" "}
            <Link href="/orders" className="font-bold text-ink underline">
              Orders
            </Link>
            .
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-ink">
            Continue shopping
          </Link>
          <Link href="/orders" className="btn-ghost">
            View my orders
          </Link>
        </div>
      </div>
    </div>
  );
}