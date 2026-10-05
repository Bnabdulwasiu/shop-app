import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./types";

const SESSION_KEY = "chemzo_supabase_session_v1";

let client: SupabaseClient | null = null;

/** Singleton Supabase client for the mobile app (same project as the web). */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: {
          getItem: (key: string) => SecureStore.getItemAsync(key),
          setItem: (key: string, value: string) =>
            SecureStore.setItemAsync(key, value),
          removeItem: (key: string) => SecureStore.deleteItemAsync(key),
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** Backwards-compat key some Supabase versions use — keep both in sync. */
export async function persistSession(raw: string) {
  await SecureStore.setItemAsync(SESSION_KEY, raw);
}

export async function readPersistedSession(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function clearPersistedSession() {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
