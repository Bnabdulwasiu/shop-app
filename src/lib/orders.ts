import { unstable_rethrow } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";

export type OrderWithItems = Order & { order_items: OrderItem[] };

/** The currently signed-in Supabase user, or null. Never throws. */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

/** All orders (with their line items) belonging to the signed-in user. */
export async function getUserOrders(): Promise<OrderWithItems[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[orders] Failed to load orders:", error);
    return [];
  }

  return (data ?? []) as OrderWithItems[];
}

/** A single order by its human-readable order number. */
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    console.error("[orders] Failed to load order:", error);
    return null;
  }

  return (data as OrderWithItems | null) ?? null;
}

/**
 * Fetch an order (and its items) using the service-role key so a *guest* can see
 * their own receipt. Only ever call this with an order number taken from the
 * `shop_last_order` cookie — never straight from the URL — to avoid enumeration.
 */
export async function getOrderReceipt(orderNumber: string): Promise<OrderWithItems | null> {
  if (!isAdminConfigured) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error) {
      console.error("[orders] Failed to load receipt:", error.message);
      return null;
    }

    return (data as OrderWithItems | null) ?? null;
  } catch (error) {
    unstable_rethrow(error);
    console.error("[orders] Failed to load receipt:", error);
    return null;
  }
}
