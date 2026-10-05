import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";
import { isConfigured } from "../lib/types";

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  user: User | null;
  accessToken: string | null;
  ready: boolean;
  error: string | null;
  /** Same Google account as the website (Supabase Auth Google provider). */
  signInWithGoogle: () => Promise<void>;
  /** Email fallback — same Supabase Auth user, works without Google config. */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const redirectTo = makeRedirectUri({ scheme: "chemzoplaza" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isConfigured) {
        setReady(true);
        return;
      }
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (active) setSession(data.session);
        supabase.auth.onAuthStateChange((_event, next) => {
          if (active) setSession(next);
        });
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Auth failed to start");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!isConfigured) {
      setError("Missing EXPO_PUBLIC_SUPABASE_URL / ANON_KEY — copy mobile/.env.example to mobile/.env");
      return;
    }
    const supabase = getSupabase();
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (oauthError || !data.url) {
      setError(oauthError?.message ?? "Could not start Google sign-in");
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      setError("Google sign-in was cancelled");
      return;
    }
    // Supabase returns the session in the redirect fragment (#access_token=...).
    const fragment = result.url.split("#")[1] ?? result.url.split("?")[1] ?? "";
    const params = new URLSearchParams(fragment);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      setError(
        "Google returned without a session. In Supabase Dashboard → Auth → URL Configuration, add this redirect: " +
          redirectTo
      );
      return;
    }
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) setError(sessionError.message);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) setError(signInError.message);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signUpError } = await getSupabase().auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpError) setError(signUpError.message);
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await getSupabase().auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      ready,
      error,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [session, ready, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
