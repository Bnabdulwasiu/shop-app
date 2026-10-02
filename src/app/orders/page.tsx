import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getCurrentUser, getUserOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="rounded-[2rem] bg-surface p-9 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-butter text-ink">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
            Log in to see your orders
          </h1>
          <p className="mt-2 text-sm font-medium text-muted">
            Google sign-in saves your cart and tracks purchases. Guest orders are still
            confirmed by email.
          </p>
          <Link href="/login" className="btn-ink mt-7">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const orders = await getUserOrders();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-[2rem] bg-surface px-8 py-16 text-center">
          <h2 className="text-xl font-extrabold">No orders yet</h2>
          <p className="mt-1 text-sm font-medium text-muted">
            When you place an order it will appear here.
          </p>
          <Link href="/" className="btn-ink mt-7">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[2rem] bg-surface p-6">
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold">{order.order_number}</p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-canvas px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                    {order.status}
                  </span>
                  <span className="price-pill bg-butter">
                    {formatMoney(order.total_cents, order.currency)}
                  </span>
                </div>
              </header>

              <ul className="mt-5 space-y-2">
                {(order.order_items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-canvas px-4 py-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-bold">
                      {item.name} &times; {item.quantity}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatMoney(item.line_total_cents, order.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs font-semibold text-muted">
                Confirmation email: {order.email_status}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}