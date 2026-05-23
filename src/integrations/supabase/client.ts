import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;

const url =
  env.VITE_SUPABASE_URL ??
  env.VITE_MY_SUPABASE_URL ??
  (typeof process !== "undefined"
    ? process.env.SUPABASE_URL ?? process.env.MY_SUPABASE_URL
    : undefined) ??
  "";

const anonKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.VITE_SUPABASE_ANON_KEY ??
  env.VITE_MY_SUPABASE_ANON_KEY ??
  (typeof process !== "undefined"
    ? process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.MY_SUPABASE_ANON_KEY
    : undefined) ??
  "";

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.warn(
    "[supabase/client] Variáveis de ambiente do Supabase ausentes. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_MY_SUPABASE_URL / VITE_MY_SUPABASE_ANON_KEY).",
  );
}

export const supabase: SupabaseClient = createClient(
  url || "http://localhost",
  anonKey || "anon",
  {
    auth: {
      persistSession: typeof window !== "undefined" && supabaseConfigured,
      autoRefreshToken: typeof window !== "undefined" && supabaseConfigured,
      detectSessionInUrl: typeof window !== "undefined" && supabaseConfigured,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  },
);
