/** Format an integer number of kobo as a Naira currency string. */
export function formatMoney(cents: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

/** Flat-rate delivery fee in kobo (₦1,500), waived above ₦50,000. */
export const SHIPPING_CENTS = 150000;          // ₦1,500
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000000; // ₦50,000

export function shippingForSubtotal(subtotalCents: number) {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
}
