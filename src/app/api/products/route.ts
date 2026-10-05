import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

/**
 * GET /api/products
 *
 * Public catalogue feed consumed by the Expo mobile app ("same API
 * endpoints" requirement). The web storefront keeps using `getProducts()`
 * directly, but the payload shape is identical.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ products: DEMO_PRODUCTS });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    const products = ((data ?? []) as Product[]).filter((p) => p.active);
    if (products.length === 0) return NextResponse.json({ products: DEMO_PRODUCTS });
    return NextResponse.json({ products });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[products] API falling back to demo catalogue:", error);
    return NextResponse.json({ products: DEMO_PRODUCTS });
  }
}
