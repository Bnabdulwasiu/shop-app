import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth redirect target.
 *
 * Supabase sends the user back here with a `code` query parameter, which we
 * exchange for a session. Register this exact URL in the Google Cloud Console
 * "Authorised redirect URI" field (via the Supabase callback URL).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
  }

  if (!code) {
    const oauthError = searchParams.get("error_description") ?? "missing_code";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth] Code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}