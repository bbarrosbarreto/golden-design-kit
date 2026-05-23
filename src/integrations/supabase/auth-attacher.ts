import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Attaches the current user's bearer token to every server function call.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return next({ headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      // ignore — fall through and call next() without auth header
    }
    return next();
  },
);
