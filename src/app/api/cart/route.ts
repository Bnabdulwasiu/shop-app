import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types";

type CartItemRow = {
  quantity: number;
  product_id: string;
  products: {
    id: string;
    slug: string;
    name: string;
    price_cents: number;
    currency: string;
    image_url: string | null;
  } | null;
};

/**
 * Server-side cart for signed-in users. Guests keep their cart in localStorage
 * on the client (see CartProvider); this route is a no-op for them.
 */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ items: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [] });

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!cart) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity, product_id, products ( id, slug, name, price_cents, currency, image_url )")
    .eq("cart_id", cart.id);

  if (error) {
    console.error("[cart] Failed to load cart:", error.message);
    return NextResponse.json({ items: [] });
  }

  const rows = (data ?? []) as unknown as CartItemRow[];
  const items: CartItem[] = rows
    .filter((row) => row.products !== null)
    .map((row) => {
      const product = row.products as NonNullable<CartItemRow["products"]>;
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.price_cents,
        currency: product.currency,
        imageUrl: product.image_url,
        quantity: row.quantity,
      };
    });

  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true, persisted: false });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, persisted: false });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const rawItems = Array.isArray((body as { items?: unknown })?.items)
    ? ((body as { items: unknown[] }).items as unknown[])
    : [];

  const items = rawItems
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const productId = typeof record.productId === "string" ? record.productId : "";
      const quantity = Number(record.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) return null;
      return { product_id: productId, quantity: Math.min(quantity, 99) };
    })
    .filter((item): item is { product_id: string; quantity: number } => item !== null);

  try {
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .upsert({ user_id: user.id }, { onConflict: "user_id" })
      .select("id")
      .single();

    if (cartError || !cart) {
      console.error("[cart] Failed to upsert cart:", cartError?.message);
      return NextResponse.json({ ok: false, error: "Could not save cart." }, { status: 500 });
    }

    await supabase.from("cart_items").delete().eq("cart_id", cart.id);

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert(items.map((item) => ({ cart_id: cart.id, ...item })));

      if (insertError) {
        console.error("[cart] Failed to insert cart items:", insertError.message);
        return NextResponse.json({ ok: false, error: "Could not save cart items." }, { status: 500 });
      }
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("[cart] Unexpected error:", error);
    return NextResponse.json({ ok: false, error: "Could not save cart." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}