import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { shippingForSubtotal } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured } from "@/lib/supabase/config";
import { getApiSupabase } from "@/lib/supabase/api-auth";
import type { CheckoutPayload } from "@/lib/types";
import { validateCheckoutPayload } from "@/lib/validation";

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  stock: number;
  active: boolean;
};

type LineItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

function formatAddress(customer: CheckoutPayload["customer"]) {
  return [
    customer.full_name,
    customer.shipping_address,
    [customer.city, customer.state, customer.postal_code].filter(Boolean).join(", "),
    customer.country,
  ]
    .filter((line) => line !== undefined && line !== null && String(line).trim().length > 0)
    .join("\n");
}

/**
 * POST /api/checkout
 *
 * 1. Validates the request.
 * 2. Re-prices the cart from the database (never trusts client prices).
 * 3. Trips the stock check.
 * 4. Persists the order + order items with the service-role key.
 * 5. Sends the Resend confirmation email and records its status.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCheckoutPayload(raw);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Please check the form and try again.", details: validation.errors },
      { status: 400 }
    );
  }
  const payload = validation.value;

  if (!isAdminConfigured) {
    return NextResponse.json(
      {
        error:
          "The store database is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to .env.local, then run supabase/schema.sql.",
      },
      { status: 503 }
    );
  }

  // Who is checking out (optional — guests are welcome).
  // Web sends cookies; the Expo app sends `Authorization: Bearer <token>`.
  let userId: string | null = null;
  try {
    const { user } = await getApiSupabase(request);
    userId = user?.id ?? null;
  } catch (error) {
    unstable_rethrow(error);
    userId = null;
  }

  const admin = createAdminClient();

  const { data: productData, error: productError } = await admin
    .from("products")
    .select("id, name, price_cents, currency, stock, active")
    .in(
      "id",
      payload.items.map((item) => item.productId)
    );

  if (productError) {
    console.error("[checkout] Failed to load products:", productError.message);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }

  const products = (productData ?? []) as ProductRow[];
  const productMap = new Map(products.map((product) => [product.id, product]));

  const lineItems: LineItem[] = [];
  const problems: string[] = [];

  for (const item of payload.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.active) {
      problems.push("A product in your cart is no longer available.");
      continue;
    }
    if (product.stock < item.quantity) {
      problems.push(`Sorry, only ${product.stock} of "${product.name}" left in stock.`);
      continue;
    }
    lineItems.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.price_cents,
      quantity: item.quantity,
      lineTotalCents: product.price_cents * item.quantity,
    });
  }

  if (problems.length > 0) {
    return NextResponse.json(
      { error: "Some items are unavailable.", details: problems },
      { status: 409 }
    );
  }

  const currency = products[0]?.currency ?? "USD";
  const subtotalCents = lineItems.reduce((total, item) => total + item.lineTotalCents, 0);
  const shippingCents = shippingForSubtotal(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  // Persist the order.
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      email: payload.customer.email,
      full_name: payload.customer.full_name,
      phone: payload.customer.phone ?? null,
      shipping_address: payload.customer.shipping_address,
      city: payload.customer.city ?? null,
      state: payload.customer.state ?? null,
      postal_code: payload.customer.postal_code ?? null,
      country: payload.customer.country ?? null,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency,
      status: "paid",
      email_status: "pending",
      notes: payload.customer.notes ?? null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("[checkout] Failed to create order:", orderError?.message);
    return NextResponse.json({ error: "Could not create your order." }, { status: 500 });
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    lineItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
      line_total_cents: item.lineTotalCents,
    }))
  );

  if (itemsError) {
    console.error("[checkout] Failed to create order items:", itemsError.message);
  }

  // Best-effort stock decrement (not atomic — fine for this demo store).
  await Promise.all(
    lineItems.map((item) => {
      const product = productMap.get(item.productId);
      const nextStock = Math.max(0, (product?.stock ?? 0) - item.quantity);
      return admin.from("products").update({ stock: nextStock }).eq("id", item.productId);
    })
  );

  // Send the confirmation email through Resend.
  const emailResult = await sendOrderConfirmationEmail({
    to: payload.customer.email,
    customerName: payload.customer.full_name,
    orderNumber: order.order_number,
    items: lineItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
    subtotalCents,
    shippingCents,
    totalCents,
    currency,
    shippingAddress: formatAddress(payload.customer),
  });

  const emailStatus = emailResult.sent ? "sent" : "failed";
  await admin.from("orders").update({ email_status: emailStatus }).eq("id", order.id);

  // Clear the persisted cart now that it has been ordered.
  if (userId) {
    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);
  }

  const response = NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
    emailSent: emailResult.sent,
    emailStatus,
    subtotalCents,
    shippingCents,
    totalCents,
    currency,
  });

  // Remember the just-placed order so the success page can display it without
  // exposing orders to anyone who guesses an order number.
  response.cookies.set("shop_last_order", order.order_number, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}