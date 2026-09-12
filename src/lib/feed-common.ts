/**
 * Helpers genéricos compartilhados pelos geradores de feed XML
 * (feed-zap.ts, feed-opennavent.ts): escape, busca no Supabase,
 * ordenação de imagens e elegibilidade.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-public";
import { evaluateReadiness, isReady } from "./property-export";
import {
  groupImagesByCategory,
  normalizePropImages,
  pickPropCover,
  type PropImage,
} from "./property-images";

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function cdata(text: string): string {
  // CDATA não pode conter "]]>" — quebra em dois blocos.
  return `<![CDATA[${text.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function tag(name: string, value: string | number, indent = "      "): string {
  return `${indent}<${name}>${typeof value === "number" ? value : escapeXml(value)}</${name}>`;
}

export function tagOptional(
  name: string,
  value: string | number | null | undefined,
  indent = "      ",
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return tag(name, value, indent);
}

export function intOrNull(value: number | null): number | null {
  if (value === null || value === undefined) return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : null;
}

/**
 * Busca paginada (1000/página) das propriedades elegíveis a exportação
 * para o portal informado. A política RLS de leitura pública se aplica.
 */
export async function fetchEligible<T>(portal: string, selectColumns: string): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      select: selectColumns,
      active: "eq.true",
      status: "eq.disponivel",
      export_enabled: "eq.true",
      export_portals: `cs.{${portal}}`,
      offset: String(offset),
      limit: String(pageSize),
    });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) break;
    const data = (await res.json()) as T[];
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export type FeedImageSource = {
  images: unknown;
  type: string | null;
  image_category_order: unknown;
};

/** Imagens na ordem exibida no site: capa primeiro, sem duplicatas. */
export function orderedImages(prop: FeedImageSource): PropImage[] {
  const images = normalizePropImages(prop.images, prop.type);
  const cover = pickPropCover(prop.images, prop.type);
  const groups = groupImagesByCategory(images, prop.type, prop.image_category_order);
  const rest = groups.flatMap((g) => g.images);
  const out: PropImage[] = [];
  const seen = new Set<string>();
  if (cover) {
    out.push(cover);
    seen.add(cover.url);
  }
  for (const img of rest) {
    if (!seen.has(img.url)) {
      out.push(img);
      seen.add(img.url);
    }
  }
  return out;
}

export type FeedReadinessSource = {
  postal_code: string | null;
  neighborhood: string | null;
  street: string | null;
  description: string | null;
  title: string | null;
  price: number | null;
  rent_price: number | null;
  export_portals: string[] | null;
};

/** Os mesmos 8 itens do painel de prontidão do formulário admin. */
export function passesReadiness(prop: FeedReadinessSource, imageCount: number): boolean {
  const checks = evaluateReadiness({
    postal_code: prop.postal_code ?? "",
    neighborhood: prop.neighborhood ?? "",
    street: prop.street ?? "",
    description: prop.description ?? "",
    imageCount,
    title: prop.title ?? "",
    price: prop.price != null ? String(prop.price) : "",
    rent_price: prop.rent_price != null ? String(prop.rent_price) : "",
    export_portals: prop.export_portals ?? [],
  });
  return isReady(checks);
}
