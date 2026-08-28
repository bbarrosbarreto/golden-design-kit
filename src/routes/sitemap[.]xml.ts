import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://brunobarretoimoveis.com.br";
const SUPABASE_URL = "https://acteyqbhonzqtnujstao.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdGV5cWJob256cXRudWpzdGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTc0OTcsImV4cCI6MjA5NTA3MzQ5N30.yemximEbICOCDRob40pZ9Q2vkQTXhUDHxszrJdJS-eE";

interface SitemapEntry {
  path: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
}

async function fetchSlugs(table: "developments" | "properties"): Promise<string[]> {
  const slugs: string[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=slug&active=eq.true&order=slug&offset=${offset}&limit=${pageSize}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) break;
    const rows = (await res.json()) as { slug: string | null }[];
    for (const row of rows) if (row.slug) slugs.push(row.slug);
    if (rows.length < pageSize) break;
  }
  return slugs;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/empreendimentos", changefreq: "weekly", priority: "0.9" },
          { path: "/imoveis", changefreq: "daily", priority: "0.9" },
          { path: "/sobre", changefreq: "monthly", priority: "0.6" },
          { path: "/contato", changefreq: "monthly", priority: "0.6" },
        ];

        const [devs, props] = await Promise.all([
          fetchSlugs("developments").catch(() => []),
          fetchSlugs("properties").catch(() => []),
        ]);

        for (const slug of devs) {
          entries.push({
            path: `/empreendimentos/${encodeURIComponent(slug)}`,
            changefreq: "weekly",
            priority: "0.8",
          });
        }
        for (const slug of props) {
          entries.push({
            path: `/imoveis/${encodeURIComponent(slug)}`,
            changefreq: "weekly",
            priority: "0.8",
          });
        }

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
