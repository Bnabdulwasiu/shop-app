import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getApiSupabase } from "@/lib/supabase/api-auth";

/**
 * GET /api/orders — order history for the signed-in user.
 *
 * Auth: web sends cookies; the Expo mobile app sends
 * `Authorization: Bearer <supabase_access_token>`.
 * Guests get `[]`, matching `getUserOrders()` behaviour on web.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ orders: [] });

  try {
    const { supabase, user } = await getApiSupabase(request);
    if (!user) return NextResponse.json({ orders: [] });

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[orders] API failed to load orders:", error.message);
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[orders] API unexpected error:", error);
    return NextResponse.json({ orders: [] });
  }
}
