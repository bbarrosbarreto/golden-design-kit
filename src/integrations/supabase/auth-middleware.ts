import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.MY_SUPABASE_URL;
const anonKey = process.env.MY_SUPABASE_ANON_KEY;

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    if (!url || !anonKey) {
      throw new Error("Supabase env vars missing on server");
    }
    const authHeader = getRequestHeader("Authorization");
    if (!authHeader) {
      throw new Response("Unauthorized: No authorization header provided", {
        status: 401,
      });
    }

    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Response("Unauthorized", { status: 401 });
    }

    return next({
      context: {
        supabase,
        userId: data.user.id,
        user: data.user,
      },
    });
  },
);
