import { createFileRoute } from "@tanstack/react-router";
import { generateZapFeed } from "@/lib/feed-zap";

export const Route = createFileRoute("/feeds/zap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = await generateZapFeed("dfimoveis");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
