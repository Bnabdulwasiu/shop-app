/**
 * Central place for Supabase configuration.
 *
 * We fall back to harmless placeholder values when the environment variables are
 * missing so that the app can still render (and `next build` succeeds) before the
 * mentor has wired up real Supabase credentials. Real requests will simply fail
 * gracefully and the UI treats the visitor as logged out.
 */

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_URL = rawUrl && rawUrl.length > 0 ? rawUrl : "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = rawAnonKey && rawAnonKey.length > 0 ? rawAnonKey : "placeholder-anon-key";

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True when the public Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(rawUrl && rawAnonKey);

/** True when a service-role key is present (server-side writes / RLS bypass). */
export const isAdminConfigured = Boolean(rawUrl && SUPABASE_SERVICE_ROLE_KEY);

/** True when Resend env vars are present. */
export const isResendConfigured = Boolean(process.env.RESEND_API_KEY);

/** @deprecated Use isResendConfigured. Kept so old imports don't break. */
export const isMailgunConfigured = isResendConfigured;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";