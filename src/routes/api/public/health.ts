import { createFileRoute } from "@tanstack/react-router";
import { checkSupabase } from "@/lib/health.functions";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const result = await checkSupabase();
        return new Response(JSON.stringify(result, null, 2), {
          status: result.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
