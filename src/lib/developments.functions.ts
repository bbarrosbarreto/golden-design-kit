import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type FeaturedDevelopment = {
  id: string;
  slug: string;
  name: string;
  region?: string | null;
  builder?: string | null;
  cover_image_url?: string | null;
  status?: string | null;
  delivery_forecast?: string | null;
  price_from?: number | null;
  created_at?: string | null;
};

export const getFeaturedDevelopments = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.MY_SUPABASE_URL;
  const key = process.env.MY_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Cloud secrets ausentes: MY_SUPABASE_URL e MY_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("developments")
    .select("id, slug, name, region, builder, cover_image_url, status, delivery_forecast, price_from, created_at")
    .eq("active", true)
    .eq("featured", true)
    .order("featured_order", { ascending: true })
    .limit(3);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeaturedDevelopment[];
});