/**
 * Gerador do feed XML no formato OpenNavent (raiz <OpenNavent>), usado
 * pelo Wimóveis e demais portais do Grupo QuintoAndar. NÃO é o padrão
 * ZAP — só os helpers genéricos de feed-common.ts são reaproveitados.
 */
import { categoryLabel } from "./property-images";
import {
  cdata,
  fetchEligible,
  intOrNull,
  orderedImages,
  passesReadiness,
  tag,
  tagOptional,
} from "./feed-common";

// ============================================================================
// VALORES PROVISÓRIOS — ponto único de troca.
//
// Os nomes oficiais de tipo/subTipo vêm do endpoint /v1/tipopropriedade da
// API da Navent, que exige credencial ainda não obtida. A mesma pendência
// vale para `operacao`, que pode ser "Venda"/"Aluguel" ou "VENTA"/"ALQUILER"
// conforme o catálogo deles. Quando a credencial chegar, ajuste APENAS os
// dois objetos abaixo — o restante do gerador não muda.
// ============================================================================
const NAVENT_TYPE_MAP: Record<string, { tipo: string; subTipo: string }> = {
  apartamento: { tipo: "Apartamento", subTipo: "Padrão" },
  cobertura: { tipo: "Apartamento", subTipo: "Cobertura" },
  casa: { tipo: "Casa", subTipo: "Padrão" },
  casa_condominio: { tipo: "Casa", subTipo: "Condominio" },
  terreno: { tipo: "Terreno", subTipo: "Padrão" },
  comercial: { tipo: "Comercial", subTipo: "Padrão" },
  rural: { tipo: "Chácara", subTipo: "Padrão" },
};

const NAVENT_OPERATIONS = { venda: "Venda", aluguel: "Aluguel" } as const;

// ATENÇÃO: o feed do Wimóveis NÃO deve ir ao ar antes de trocar o valor
// abaixo pelo email real — é o endereço para onde o portal envia os leads.
const NAVENT_CONTACT_EMAIL = "brunobarreto.corretor@gmail.com";

/** OpenNavent limita a 50 imagens por anúncio. */
const NAVENT_MAX_IMAGES = 50;

type FeedProperty = {
  listing_code: string | null;
  slug: string | null;
  title: string | null;
  type: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  rent_price: number | null;
  description: string | null;
  purpose: string | null;
  area: number | null;
  useful_area: number | null;
  built_area: number | null;
  images: unknown;
  image_category_order: unknown;
  video_url: string | null;
  export_portals: string[] | null;
};

const SELECT_COLUMNS = [
  "listing_code",
  "slug",
  "title",
  "type",
  "state",
  "city",
  "neighborhood",
  "street",
  "street_number",
  "postal_code",
  "latitude",
  "longitude",
  "price",
  "rent_price",
  "description",
  "purpose",
  "area",
  "useful_area",
  "built_area",
  "images",
  "image_category_order",
  "video_url",
  "export_portals",
].join(",");

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Extrai SOMENTE o código do vídeo do YouTube (o feed não aceita URL).
 * Cobre youtu.be/ID, youtube.com/watch?v=ID e youtube.com/embed/ID,
 * ignorando parâmetros extras como ?si=.
 */
function extractYouTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be" || host.endsWith(".youtu.be")) {
    id = parsed.pathname.replace(/^\//, "").split("/")[0] || null;
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    id = parsed.searchParams.get("v");
    if (!id) {
      const embed = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) id = embed[1];
    }
  }
  if (id && /^[\w-]{6,20}$/.test(id)) return id;
  return null;
}

function naventType(type: string | null): { tipo: string; subTipo: string } {
  return NAVENT_TYPE_MAP[type ?? ""] ?? NAVENT_TYPE_MAP.apartamento;
}

function buildPrecos(prop: FeedProperty): string | null {
  const preco = (quantidade: number, operacao: string) =>
    [
      "        <preco>",
      `          <quantidade>${quantidade}</quantidade>`,
      "          <moeda>BRL</moeda>",
      `          <operacao>${operacao}</operacao>`,
      "        </preco>",
    ].join("\n");

  const blocos: string[] = [];
  if (prop.purpose === "aluguel") {
    const aluguel = intOrNull(prop.price);
    if (aluguel !== null && aluguel > 0) {
      blocos.push(preco(aluguel, NAVENT_OPERATIONS.aluguel));
    }
  } else {
    const venda = intOrNull(prop.price);
    if (venda !== null && venda > 0) {
      blocos.push(preco(venda, NAVENT_OPERATIONS.venda));
    }
    const aluguel = intOrNull(prop.rent_price);
    if (aluguel !== null && aluguel > 0) {
      blocos.push(preco(aluguel, NAVENT_OPERATIONS.aluguel));
    }
  }
  if (blocos.length === 0) return null;
  return ["      <precos>", ...blocos, "      </precos>"].join("\n");
}

function buildLocalizacao(prop: FeedProperty): string {
  const lines: (string | null)[] = ["      <localizacao>"];
  const endereco = prop.street_number
    ? `${prop.street ?? ""}, ${prop.street_number}`
    : prop.street;
  lines.push(tagOptional("endereco", endereco, "        "));
  lines.push(
    tagOptional(
      "localidade",
      `${prop.neighborhood ?? ""},${prop.city ?? ""},${prop.state ?? ""},Brasil`,
      "        ",
    ),
  );
  const cep = (prop.postal_code ?? "").replace(/\D/g, "");
  lines.push(tagOptional("codigoPostal", cep.length === 8 ? cep : null, "        "));
  lines.push(tag("mostrarMapa", "APROXIMADO", "        "));
  if (prop.latitude !== null && prop.latitude >= -90 && prop.latitude <= 90) {
    lines.push(tag("latitude", prop.latitude, "        "));
  }
  if (prop.longitude !== null && prop.longitude >= -180 && prop.longitude <= 180) {
    lines.push(tag("longitude", prop.longitude, "        "));
  }
  lines.push("      </localizacao>");
  return lines.filter((l): l is string => l !== null).join("\n");
}

function buildMultimidia(prop: FeedProperty, images: { url: string; category: string }[]): string {
  const blocos: string[] = ["      <multimidia>"];

  const fotos = images.slice(0, NAVENT_MAX_IMAGES);
  if (fotos.length > 0) {
    const itens = fotos
      .map((img) => {
        const label = categoryLabel(img.category, prop.type);
        const titulo =
          label && label !== img.category
            ? `\n            <titulo>${cdata(label)}</titulo>`
            : "";
        return [
          "          <imagem>",
          `            <urlImagem>${cdata(img.url)}</urlImagem>${titulo}`,
          "          </imagem>",
        ].join("\n");
      })
      .join("\n");
    blocos.push(`        <imagens>\n${itens}\n        </imagens>`);
  }

  if (prop.video_url) {
    const videoId = extractYouTubeId(prop.video_url);
    if (videoId) {
      blocos.push(
        `        <videos>\n          <video>\n            <codigoVideo>${cdata(videoId)}</codigoVideo>\n          </video>\n        </videos>`,
      );
    }
  }

  blocos.push("      </multimidia>");
  return blocos.join("\n");
}

function buildImovel(prop: FeedProperty, images: { url: string; category: string }[]): string {
  const { tipo, subTipo } = naventType(prop.type);
  const lines: (string | null)[] = [];

  const codigo = prop.listing_code ? stripAccents(prop.listing_code).slice(0, 100) : null;
  lines.push(tagOptional("codigoAnuncio", codigo));
  lines.push(tagOptional("codigoReferencia", prop.slug));
  if (prop.title) {
    lines.push(`      <titulo>${cdata(prop.title)}</titulo>`);
  }
  if (prop.description) {
    lines.push(`      <descricao>${cdata(prop.description)}</descricao>`);
  }
  lines.push(
    [
      "      <tipoPropriedade>",
      `        <tipo>${cdata(tipo)}</tipo>`,
      `        <subTipo>${cdata(subTipo)}</subTipo>`,
      "      </tipoPropriedade>",
    ].join("\n"),
  );
  lines.push(buildPrecos(prop));
  lines.push(buildLocalizacao(prop));
  lines.push(buildMultimidia(prop, images));
  lines.push(
    "      <publicacao>\n        <tipoPublicacao>SIMPLE</tipoPublicacao>\n      </publicacao>",
  );
  lines.push(
    [
      "      <publicador>",
      "        <nomeContato>Bruno Barreto</nomeContato>",
      "        <telefoneContato>61 99935-0888</telefoneContato>",
      `        <emailContato>${NAVENT_CONTACT_EMAIL}</emailContato>`,
      "      </publicador>",
    ].join("\n"),
  );

  return ["    <Imovel>", ...lines.filter((l): l is string => l !== null), "    </Imovel>"].join(
    "\n",
  );
}

export async function generateOpenNaventFeed(portal: string): Promise<string> {
  let imoveisXml = "";
  let total = 0;
  try {
    const rows = await fetchEligible<FeedProperty>(portal, SELECT_COLUMNS);
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
    total = imoveis.length;
  } catch {
    // Falha de rede/parse: devolve feed vazio em vez de erro.
  }

  // Sem email real, o portal enviaria os leads para um endereço inválido.
  // O bloqueio só vale quando há anúncios reais para publicar; feed vazio
  // sai normal (com aviso em comentário XML) para não quebrar o preview.
  const emailPendente = NAVENT_CONTACT_EMAIL === "SUBSTITUIR_PELO_EMAIL_REAL";
  if (emailPendente && total > 0) {
    throw new Error(
      "feed-opennavent: NAVENT_CONTACT_EMAIL ainda é o placeholder. " +
        "Troque pelo email real em src/lib/feed-opennavent.ts antes de publicar o feed.",
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<OpenNavent>",
    `  <dataModificacao>${cdata(String(Date.now()))}</dataModificacao>`,
    ...(emailPendente
      ? ["  <!-- ATENÇÃO: troque NAVENT_CONTACT_EMAIL pelo email real antes de publicar este feed. -->"]
      : []),
    "  <Imoveis>",
    imoveisXml,
    "  </Imoveis>",
    "</OpenNavent>",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
