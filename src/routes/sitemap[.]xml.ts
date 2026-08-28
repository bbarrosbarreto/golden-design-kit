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
  lastmod?: string;
}

interface SlugRow {
  slug: string | null;
  updated_at: string | null;
}

function toISODate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

async function fetchSlugs(table: "developments" | "properties"): Promise<SlugRow[]> {
  const rows: SlugRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=slug,updated_at&active=eq.true&order=slug&offset=${offset}&limit=${pageSize}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) break;
    const data = (await res.json()) as SlugRow[];
    for (const row of data) {
      if (row.slug) rows.push(row);
    }
    if (data.length < pageSize) break;
  }
  return rows;
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

        for (const row of devs) {
          entries.push({
            path: `/empreendimentos/${encodeURIComponent(row.slug!)}`,
            changefreq: "weekly",
            priority: "0.8",
            lastmod: toISODate(row.updated_at),
          });
        }
        for (const row of props) {
          entries.push({
            path: `/imoveis/${encodeURIComponent(row.slug!)}`,
            changefreq: "weekly",
            priority: "0.8",
            lastmod: toISODate(row.updated_at),
          });
        }

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
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
