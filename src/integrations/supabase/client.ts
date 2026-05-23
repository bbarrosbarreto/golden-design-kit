import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  (import.meta.env.VITE_MY_SUPABASE_URL as string | undefined) ??
  (typeof process !== "undefined" ? process.env.MY_SUPABASE_URL : undefined) ??
  "";

const anonKey =
  (import.meta.env.VITE_MY_SUPABASE_ANON_KEY as string | undefined) ??
  (typeof process !== "undefined" ? process.env.MY_SUPABASE_ANON_KEY : undefined) ??
  "";

// Don't throw at module init — that crashes SSR before anything renders.
// Server-side data fetching uses createServerFn with process.env directly.
// This browser client is only used for auth session attachment.
if (!url || !anonKey) {
  console.warn(
    "[supabase/client] VITE_MY_SUPABASE_URL/VITE_MY_SUPABASE_ANON_KEY ausentes. Auth desabilitada no browser.",
  );
}

export const supabase: SupabaseClient = createClient(
  url || "http://localhost",
  anonKey || "anon",
  {
    auth: {
      persistSession: typeof window !== "undefined" && Boolean(url && anonKey),
      autoRefreshToken: typeof window !== "undefined" && Boolean(url && anonKey),
      detectSessionInUrl: typeof window !== "undefined" && Boolean(url && anonKey),
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  },
);
