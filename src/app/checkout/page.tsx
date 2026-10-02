import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCurrentUser } from "@/lib/orders";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Checkout</h1>
      <p className="mb-8 mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted">
        Review your order, add your shipping details and place it. You&rsquo;ll get a
        confirmation email right away.
      </p>

      <CheckoutForm
        defaultName={meta.full_name ?? meta.name ?? ""}
        defaultEmail={user?.email ?? ""}
      />
    </div>
  );
}