import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdminConfigured, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./config";

/**
 * Privileged Supabase client that uses the SERVICE ROLE key.
 *
 * NEVER import this into a Client Component. It bypasses Row Level Security and
 * is only used server-side for trusted writes (creating orders, order items and
 * updating product stock). Orders deliberately have no public INSERT policy, so
 * the service role is required to write them.
 */
export function createAdminClient() {
  if (!isAdminConfigured) {
    throw new Error(
      "Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
