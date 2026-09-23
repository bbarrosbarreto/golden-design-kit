import { createFileRoute } from "@tanstack/react-router";
import { generateDfImoveisFeed } from "@/lib/feed-dfimoveis";

export const Route = createFileRoute("/feeds/dfimoveis.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = await generateDfImoveisFeed("dfimoveis");
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
