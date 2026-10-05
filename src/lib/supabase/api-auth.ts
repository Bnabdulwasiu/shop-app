import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";
import { createClient as createCookieClient } from "./server";

/**
 * Resolve the signed-in user for API routes called from web AND mobile.
 *
 * - Web (browser): session lives in cookies -> `createCookieClient().auth.getUser()`.
 * - Mobile (Expo / native): no cookies. The app sends
 *   `Authorization: Bearer <supabase_access_token>` and we validate that JWT
 *   against Supabase Auth directly.
 *
 * Returns `{ user, accessToken }` where `accessToken` is the mobile Bearer
 * token when one was supplied (null for cookie sessions).
 */
export async function getApiUser(request: Request) {
  if (!isSupabaseConfigured) return { user: null, accessToken: null as string | null };

  const header = request.headers.get("authorization") ?? "";
  const bearer =
    header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;

  if (bearer) {
    try {
      const direct = createSupabaseJsClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await direct.auth.getUser(bearer);
      if (!error && data.user) {
        return { user: data.user, accessToken: bearer };
      }
      // Fall through to cookie auth so a stale Bearer doesn't hard-fail web.
    } catch {
      /* ignore — try cookie session below */
    }
  }

  try {
    const supabase = await createCookieClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user: user ?? null, accessToken: bearer };
  } catch {
    return { user: null, accessToken: bearer };
  }
}

/**
 * Authenticated Supabase client for API routes called from web AND mobile.
 *
 * - Web (browser): cookies carry the session — use the SSR cookie client so
 *   RLS sees `auth.uid()`.
 * - Mobile (Expo / native): no cookies. The app sends
 *   `Authorization: Bearer <supabase_access_token>`; we build a PostgREST
 *   client with that JWT in the global header so RLS still sees the user.
 */
export async function getApiSupabase(request: Request) {
  const { user, accessToken } = await getApiUser(request);

  if (accessToken) {
    const authed = createSupabaseJsClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    return { supabase: authed, user, accessToken };
  }

  const supabase = await createCookieClient();
  return { supabase, user, accessToken };
}

