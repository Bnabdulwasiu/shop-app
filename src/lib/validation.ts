import type { CheckoutPayload } from "./types";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validate the raw JSON body posted to /api/checkout.
 * Prices are deliberately NOT accepted from the client — the server looks them
 * up from the database so totals cannot be tampered with.
 */
export function validateCheckoutPayload(raw: unknown): ValidationResult<CheckoutPayload> {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  const body = raw as Record<string, unknown>;
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const rawCustomer = (body.customer ?? {}) as Record<string, unknown>;

  const items: CheckoutPayload["items"] = [];
  const seen = new Set<string>();

  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const productId = asTrimmedString(item.productId);
    const quantity = Number(item.quantity);

    if (!productId) continue;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errors.push(`Invalid quantity for product ${productId}.`);
      continue;
    }
    if (seen.has(productId)) {
      errors.push(`Duplicate product ${productId} in cart.`);
      continue;
    }

    seen.add(productId);
    items.push({ productId, quantity });
  }

  if (items.length === 0) {
    errors.push("Your cart is empty.");
  }

  const full_name = asTrimmedString(rawCustomer.full_name);
  const email = asTrimmedString(rawCustomer.email);
  const shipping_address = asTrimmedString(rawCustomer.shipping_address);

  if (full_name.length < 2) errors.push("Please enter your full name.");
  if (!EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");
  if (shipping_address.length < 5) errors.push("Please enter a shipping address.");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      items,
      customer: {
        full_name,
        email,
        phone: asTrimmedString(rawCustomer.phone) || undefined,
        shipping_address,
        city: asTrimmedString(rawCustomer.city) || undefined,
        state: asTrimmedString(rawCustomer.state) || undefined,
        postal_code: asTrimmedString(rawCustomer.postal_code) || undefined,
        country: asTrimmedString(rawCustomer.country) || undefined,
        notes: asTrimmedString(rawCustomer.notes) || undefined,
      },
    },
  };
}