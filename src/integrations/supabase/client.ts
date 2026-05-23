import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  (import.meta.env.VITE_MY_SUPABASE_URL as string | undefined) ??
  (typeof process !== "undefined" ? process.env.MY_SUPABASE_URL : undefined);

const anonKey =
  (import.meta.env.VITE_MY_SUPABASE_ANON_KEY as string | undefined) ??
  (typeof process !== "undefined" ? process.env.MY_SUPABASE_ANON_KEY : undefined);

if (!url || !anonKey) {
  throw new Error(
    "Supabase env vars missing. Set VITE_MY_SUPABASE_URL and VITE_MY_SUPABASE_ANON_KEY in Workspace Build Secrets.",
  );
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
