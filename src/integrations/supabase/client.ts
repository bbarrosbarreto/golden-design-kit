import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://acteyqbhonzqtnujstao.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdGV5cWJob256cXRudWpzdGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTc0OTcsImV4cCI6MjA5NTA3MzQ5N30.yemximEbICOCDRob40pZ9Q2vkQTXhUDHxszrJdJS-eE";

export const supabaseConfigured = true;

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  },
);
