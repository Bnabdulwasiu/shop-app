import { unstable_rethrow } from "next/navigation";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Return the active catalogue. Falls back to the bundled demo catalogue when
 * Supabase is not configured yet or the products table is empty, so the shop is
 * always browsable.
 */
export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return DEMO_PRODUCTS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return DEMO_PRODUCTS;

    return data as Product[];
  } catch (error) {
    // Never swallow Next.js control-flow errors (dynamic/static bailouts,
    // redirects, notFound). Only our own query failures should be handled here.
    unstable_rethrow(error);
    console.error("[products] Falling back to demo catalogue:", error);
    return DEMO_PRODUCTS;
  }
}

/** Look a product up by UUID or slug. */
export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const demoMatch =
    DEMO_PRODUCTS.find((product) => product.id === idOrSlug || product.slug === idOrSlug) ?? null;

  if (!isSupabaseConfigured) return demoMatch;

  try {
    const supabase = await createClient();
    const base = supabase.from("products").select("*");
    const { data, error } = UUID_RE.test(idOrSlug)
      ? await base.eq("id", idOrSlug).maybeSingle()
      : await base.eq("slug", idOrSlug).maybeSingle();

    if (error) throw error;
    return (data as Product | null) ?? demoMatch;
  } catch (error) {
    unstable_rethrow(error);
    console.error("[products] Falling back to demo product:", error);
    return demoMatch;
  }
}
