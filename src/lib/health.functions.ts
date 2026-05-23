import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const checkSupabase = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.MY_SUPABASE_URL ?? process.env.VITE_MY_SUPABASE_URL;
  const key = process.env.MY_SUPABASE_ANON_KEY ?? process.env.VITE_MY_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { ok: false, error: "Missing MY_SUPABASE_URL or MY_SUPABASE_ANON_KEY in runtime env" };
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const tables = ["developments", "properties", "site_settings", "partners", "testimonials", "regions"] as const;
  const results: Record<string, { count: number | null; error: string | null }> = {};

  for (const t of tables) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    results[t] = { count: count ?? null, error: error?.message ?? null };
  }

  return { ok: true, urlHost: new URL(url).host, tables: results };
});
