import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.MY_SUPABASE_URL;
const serviceRoleKey = process.env.MY_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Server Supabase env vars missing. Set MY_SUPABASE_URL and MY_SUPABASE_SERVICE_ROLE_KEY as runtime secrets.",
  );
}

// Admin client — bypasses RLS. Server-only. Never import from client code.
export const supabaseAdmin: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
