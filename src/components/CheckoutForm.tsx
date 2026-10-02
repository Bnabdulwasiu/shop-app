"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { formatMoney, shippingForSubtotal } from "@/lib/money";

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  notes: string;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-bold">
        {label}
        {required ? <span className="text-ink/40"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
    </label>
  );
}

export function CheckoutForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const { items, count, subtotalCents, ready, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>({
    full_name: defaultName,
    email: defaultEmail,
    phone: "",
    shipping_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Nigeria",
    notes: "",
  });

  const currency = items[0]?.currency ?? "USD";
  const shippingCents = shippingForSubtotal(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    if (items.length === 0) {
      setErrors(["Your cart is empty."]);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          customer: form,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: string[];
        orderNumber?: string;
      };

      if (!response.ok) {
        setErrors([
          data.error ?? "Something went wrong. Please try again.",
          ...(data.details ?? []),
        ]);
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber ?? "")}`);
    } catch {
      setErrors(["Network error. Please check your connection and try again."]);
      setSubmitting(false);
    }
  }

  if (ready && items.length === 0) {
    return (
      <div className="rounded-[2rem] bg-surface px-8 py-16 text-center">
        <h2 className="text-xl font-extrabold">Your cart is empty</h2>
        <p className="mt-1 text-sm font-medium text-muted">
          Add something to your cart before checking out.
        </p>
        <Link href="/" className="btn-ink mt-7">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {errors.length > 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-blush p-5 text-sm text-ink">
            <p className="font-bold">{errors[0]}</p>
            {errors.length > 1 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 font-medium">
                {errors.slice(1).map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <section className="rounded-[2rem] bg-surface p-7">
          <h2 className="text-lg font-extrabold">Contact</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={form.full_name}
              onChange={(value) => update("full_name", value)}
              required
              autoComplete="name"
              placeholder="Amaka Okafor"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => update("email", value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <div className="sm:col-span-2">
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(value) => update("phone", value)}
                autoComplete="tel"
                placeholder="+234 801 234 5678"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface p-7">
          <h2 className="text-lg font-extrabold">Shipping address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Address"
                value={form.shipping_address}
                onChange={(value) => update("shipping_address", value)}
                required
                autoComplete="street-address"
                placeholder="12 Adeola Odeku Street, VI"
              />
            </div>
            <Field
              label="City"
              value={form.city}
              onChange={(value) => update("city", value)}
              autoComplete="address-level2"
            />
            <Field
              label="State / Region"
              value={form.state}
              onChange={(value) => update("state", value)}
              autoComplete="address-level1"
            />
            <Field
              label="Postal code"
              value={form.postal_code}
              onChange={(value) => update("postal_code", value)}
              autoComplete="postal-code"
            />
            <Field
              label="Country"
              value={form.country}
              onChange={(value) => update("country", value)}
              autoComplete="country-name"
            />
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface p-7">
          <h2 className="text-lg font-extrabold">Notes</h2>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Optional delivery notes"
            className="field mt-4"
          />
        </section>
      </div>

      <aside className="panel-ink h-fit p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Order</h2>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-butter text-sm font-extrabold text-ink">
            {count}
          </span>
        </div>

        <ul className="mt-5 space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-4">
              <span className="min-w-0 truncate text-white/60">
                {item.name} &times; {item.quantity}
              </span>
              <span className="shrink-0 font-semibold">
                {formatMoney(item.priceCents * item.quantity, item.currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm">
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

        <div className="mt-5 rounded-3xl bg-butter p-5 text-ink">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/55">
            Total Amount
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">
            {formatMoney(totalCents, currency)}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>

        <p className="mt-4 text-center text-xs font-semibold text-white/45">
          A confirmation email will be sent to your inbox.
        </p>
      </aside>
    </form>
  );
}