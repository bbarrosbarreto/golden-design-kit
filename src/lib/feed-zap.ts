/**
 * Gerador do feed XML padrão ZAP (Grupo OLX/ZAP), consumido hoje pelo
 * DF Imóveis. Recebe o código do portal para filtrar `export_portals`,
 * permitindo reaproveitar o mesmo gerador para outros portais ZAP.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-public";
import { evaluateReadiness, isReady, zapPropertyType } from "./property-export";
import {
  groupImagesByCategory,
  normalizePropImages,
  pickPropCover,
  type PropImage,
} from "./property-images";

type FeedProperty = {
  listing_code: string | null;
  title: string | null;
  type: string | null;
  category: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  street_number: string | null;
  complement: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  rent_price: number | null;
  condo_fee: number | null;
  iptu: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  living_rooms: number | null;
  parking_spots: number | null;
  area: number | null;
  useful_area: number | null;
  built_area: number | null;
  year_built: number | null;
  description: string | null;
  purpose: string | null;
  images: unknown;
  image_category_order: unknown;
  video_url: string | null;
  export_portals: string[] | null;
};

const SELECT_COLUMNS = [
  "listing_code",
  "title",
  "type",
  "category",
  "state",
  "city",
  "neighborhood",
  "street",
  "street_number",
  "complement",
  "postal_code",
  "latitude",
  "longitude",
  "price",
  "rent_price",
  "condo_fee",
  "iptu",
  "bedrooms",
  "suites",
  "bathrooms",
  "living_rooms",
  "parking_spots",
  "area",
  "useful_area",
  "built_area",
  "year_built",
  "description",
  "purpose",
  "images",
  "image_category_order",
  "video_url",
  "export_portals",
].join(",");

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(text: string): string {
  // CDATA não pode conter "]]>" — quebra em dois blocos.
  return `<![CDATA[${text.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function tag(name: string, value: string | number): string {
  return `      <${name}>${typeof value === "number" ? value : escapeXml(value)}</${name}>`;
}

function tagOptional(name: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return tag(name, value);
}

function intOrNull(value: number | null): number | null {
  if (value === null || value === undefined) return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : null;
}

async function fetchEligible(portal: string): Promise<FeedProperty[]> {
  const rows: FeedProperty[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      select: SELECT_COLUMNS,
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
    const data = (await res.json()) as FeedProperty[];
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

function orderedImages(prop: FeedProperty): PropImage[] {
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

function isYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function passesReadiness(prop: FeedProperty, imageCount: number): boolean {
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

function buildImovel(prop: FeedProperty, images: PropImage[]): string {
  const { tipo, subtipo, categoria } = zapPropertyType(prop.type, prop.category);
  const lines: (string | null)[] = [];

  lines.push(tagOptional("CodigoImovel", prop.listing_code));
  lines.push(tagOptional("TituloImovel", prop.title));
  lines.push(tagOptional("TipoImovel", tipo));
  lines.push(tagOptional("SubTipoImovel", subtipo));
  lines.push(tagOptional("CategoriaImovel", categoria));
  lines.push(tagOptional("Estado", prop.state));
  lines.push(tagOptional("Cidade", prop.city));
  if (prop.neighborhood) {
    lines.push(`      <Bairro>${cdata(prop.neighborhood)}</Bairro>`);
  }
  lines.push(tagOptional("Endereco", prop.street));
  lines.push(tagOptional("Numero", prop.street_number));
  lines.push(tagOptional("Complemento", prop.complement));
  const cep = (prop.postal_code ?? "").replace(/\D/g, "");
  lines.push(tagOptional("CEP", cep.length === 8 ? cep : null));
  lines.push(tagOptional("Latitude", prop.latitude));
  lines.push(tagOptional("Longitude", prop.longitude));

  if (prop.purpose === "aluguel") {
    const aluguel = intOrNull(prop.price);
    if (aluguel !== null) lines.push(tag("PrecoAluguel", aluguel));
  } else {
    const venda = intOrNull(prop.price);
    if (venda !== null) lines.push(tag("PrecoVenda", venda));
    const aluguel = intOrNull(prop.rent_price);
    if (aluguel !== null && aluguel > 0) lines.push(tag("PrecoAluguel", aluguel));
  }

  lines.push(tagOptional("PrecoCondominio", intOrNull(prop.condo_fee)));
  lines.push(tagOptional("IPTU", intOrNull(prop.iptu)));
  lines.push(tagOptional("QtdDormitorios", prop.bedrooms));
  lines.push(tagOptional("QtdSuites", prop.suites));
  lines.push(tagOptional("QtdBanheiros", prop.bathrooms));
  lines.push(tagOptional("QtdSalas", prop.living_rooms));
  lines.push(tagOptional("QtdVagas", prop.parking_spots));
  lines.push(tagOptional("AreaTotal", intOrNull(prop.area)));
  lines.push(tagOptional("AreaUtil", intOrNull(prop.useful_area ?? prop.built_area)));
  lines.push(tagOptional("AnoConstrucao", prop.year_built));
  lines.push(`      <Observacao>${cdata(prop.description ?? "")}</Observacao>`);
  lines.push(tag("TipoOferta", 1));

  const fotos = images
    .map((img, i) =>
      [
        "        <Foto>",
        `          <URLArquivo>${escapeXml(img.url)}</URLArquivo>`,
        `          <Principal>${i === 0 ? 1 : 0}</Principal>`,
        "        </Foto>",
      ].join("\n"),
    )
    .join("\n");
  lines.push(`      <Fotos>\n${fotos}\n      </Fotos>`);

  if (prop.video_url && isYouTube(prop.video_url)) {
    lines.push(
      `      <Videos>\n        <Video>\n          <Url>${cdata(prop.video_url)}</Url>\n        </Video>\n      </Videos>`,
    );
  }

  return ["    <Imovel>", ...lines.filter((l): l is string => l !== null), "    </Imovel>"].join(
    "\n",
  );
}

export async function generateZapFeed(portal: string): Promise<string> {
  let imoveisXml = "";
  try {
    const rows = await fetchEligible(portal);
    const imoveis: string[] = [];
    for (const prop of rows) {
      const images = orderedImages(prop);
      const hasArea =
        prop.area != null || prop.useful_area != null || prop.built_area != null;
      if (!hasArea) continue;
      if (!passesReadiness(prop, images.length)) continue;
      imoveis.push(buildImovel(prop, images));
    }
    imoveisXml = imoveis.join("\n");
  } catch {
    // Falha de rede/parse: devolve feed vazio em vez de erro.
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Carga xmlns:xsd="http://www.w3.org/2001/XMLSchema"',
    '       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    "  <Imoveis>",
    imoveisXml,
    "  </Imoveis>",
    "</Carga>",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
