import { createFileRoute } from "@tanstack/react-router";
import { generateOpenNaventFeed } from "@/lib/feed-opennavent";

export const Route = createFileRoute("/feeds/wimoveis.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await generateOpenNaventFeed("wimoveis");
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=900",
            },
          });
        } catch (err) {
          // Configuração pendente (ex: email placeholder): erro claro, sem XML inválido.
          const message = err instanceof Error ? err.message : "Erro ao gerar o feed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
