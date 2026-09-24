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
// IDS OFICIAIS DO CATÁLOGO DA NAVENT — ponto único de troca.
//
// Fonte: GET /v1/tipopropriedade, /v1/tipopropriedade/{id}/subtipos e
// /v1/operacoes, consultados em 15/09/2026. Os JSON estão em docs/navent/
// e o de-para completo está em docs/navent/README.md.
//
// A documentação recomenda enviar os IDS numéricos (idTipo/idSubTipo) em vez
// dos nomes, porque nome está sujeito a erro de ortografia.
// ============================================================================
const NAVENT_TYPE_MAP: Record<string, { idTipo: string; idSubTipo: string }> = {
  apartamento: { idTipo: "2", idSubTipo: "1" }, // Apartamento / Padrão
  cobertura: { idTipo: "2", idSubTipo: "26" }, // Apartamento / Cobertura
  casa: { idTipo: "1", idSubTipo: "5" }, // Casa / Padrão
  casa_condominio: { idTipo: "1", idSubTipo: "6" }, // Casa / Casa de Condomínio
  terreno: { idTipo: "1003", idSubTipo: "8" }, // Terreno / Terreno Padrão
  comercial: { idTipo: "1005", idSubTipo: "16" }, // Comercial / Conjunto Comercial/sala
  rural: { idTipo: "1004", idSubTipo: "10" }, // Rurais / Chácara
};

// Subtipos que dependem da categoria do anúncio (docs/navent/subtipos-*.json).
const NAVENT_SUBTIPO_COBERTURA = "26"; // Apartamento / Cobertura
const NAVENT_SUBTIPO_SOBRADO = "33"; // Casa / Sobrado
// Não existe subtipo "Térrea" no catálogo: cai em Casa / Padrão (5).

// /v1/operacoes devolve os nomes em espanhol mesmo no catálogo brasileiro.
const NAVENT_OPERATIONS = { venda: "VENTA", aluguel: "ALQUILER" } as const;

// Características numéricas (todas "Campo numerico abierto" → usam <valor>).
// id + nome exatamente como no catálogo (docs/navent/caracteristicas-*.json).
const NAVENT_FEATURES = {
  quartos: { id: "CFT2", nome: "PRINCIPALES|QUARTO" },
  banheiros: { id: "CFT3", nome: "PRINCIPALES|BANHEIRO" },
  suites: { id: "CFT4", nome: "PRINCIPALES|SUITE" },
  vagas: { id: "CFT7", nome: "PRINCIPALES|VAGA" },
  areaTotal: { id: "CFT100", nome: "MEDIDAS|AREA_TOTAL" },
  areaUtil: { id: "CFT101", nome: "MEDIDAS|AREA_UTIL" },
  // Idade em anos, não o ano de construção.
  idadeImovel: { id: "CFT5", nome: "PRINCIPALES|IDADE_DO_IMOVEL" },
} as const;

// CON1 é "Select" (valores HA ou M2) → usa <idValor>. Pedido do QuintoAndar.
const NAVENT_UNIDADE_MEDIDA = { id: "CON1", nome: "MEDIDAS|UNIDAD_DE_MEDIDA", idValor: "M2" };

// Sigla → nome por extenso, usado só em <localidade> (o banco guarda a sigla).
const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

function stateFullName(state: string | null): string {
  const raw = (state ?? "").trim();
  return UF_NAMES[raw.toUpperCase()] ?? raw;
}

// ATENÇÃO: o feed do Wimóveis NÃO deve ir ao ar antes de trocar o valor
// abaixo pelo email real — é o endereço para onde o portal envia os leads.
const NAVENT_CONTACT_EMAIL: string = "brunobarreto.corretor@gmail.com";

/** OpenNavent limita a 50 imagens por anúncio. */
const NAVENT_MAX_IMAGES = 50;

type FeedProperty = {
  listing_code: string | null;
  slug: string | null;
  title: string | null;
  type: string | null;
  category: string | null;
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
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parking_spots: number | null;
  year_built: number | null;
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
  "category",
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
  "bedrooms",
  "bathrooms",
  "suites",
  "parking_spots",
  "year_built",
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

function naventType(
  type: string | null,
  category: string | null,
): { idTipo: string; idSubTipo: string } {
  const base = NAVENT_TYPE_MAP[type ?? ""] ?? NAVENT_TYPE_MAP.apartamento;
  const cat = category ?? "";
  if (type === "apartamento" && cat.startsWith("cobertura")) {
    return { idTipo: base.idTipo, idSubTipo: NAVENT_SUBTIPO_COBERTURA };
  }
  if (type === "casa" && cat.startsWith("sobrado")) {
    return { idTipo: base.idTipo, idSubTipo: NAVENT_SUBTIPO_SOBRADO };
  }
  return base;
}

/**
 * Bloco <caracteristicas> com os ids oficiais do catálogo (docs/navent/).
 * Cada valor nulo é omitido; nenhum id fora do catálogo é emitido.
 */
function buildCaracteristicas(prop: FeedProperty): string | null {
  const itens: string[] = [];
  let temArea = false;
  const add = (f: { id: string; nome: string }, value: number | null): boolean => {
    if (value === null || !Number.isFinite(value) || value < 0) return false;
    itens.push(
      [
        "        <caracteristica>",
        `          <id>${f.id}</id>`,
        `          <nome>${f.nome}</nome>`,
        `          <valor>${value}</valor>`,
        "        </caracteristica>",
      ].join("\n"),
    );
    return true;
  };

  add(NAVENT_FEATURES.quartos, intOrNull(prop.bedrooms));
  add(NAVENT_FEATURES.banheiros, intOrNull(prop.bathrooms));
  add(NAVENT_FEATURES.suites, intOrNull(prop.suites));
  add(NAVENT_FEATURES.vagas, intOrNull(prop.parking_spots));
  if (add(NAVENT_FEATURES.areaTotal, intOrNull(prop.area))) temArea = true;
  if (add(NAVENT_FEATURES.areaUtil, intOrNull(prop.useful_area ?? prop.built_area))) temArea = true;

  if (temArea) {
    itens.push(
      [
        "        <caracteristica>",
        `          <id>${NAVENT_UNIDADE_MEDIDA.id}</id>`,
        `          <nome>${NAVENT_UNIDADE_MEDIDA.nome}</nome>`,
        `          <idValor>${NAVENT_UNIDADE_MEDIDA.idValor}</idValor>`,
        "        </caracteristica>",
      ].join("\n"),
    );
  }

  // CFT5 é IDADE_DO_IMOVEL (anos), não o ano de construção.
  const ano = intOrNull(prop.year_built);
  if (ano !== null && ano >= 1900) {
    const idade = new Date().getFullYear() - ano;
    if (idade >= 0) add(NAVENT_FEATURES.idadeImovel, idade);
  }

  // living_rooms não é enviado: não há característica equivalente no catálogo.

  if (itens.length === 0) return null;
  return ["      <caracteristicas>", ...itens, "      </caracteristicas>"].join("\n");
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
  const { idTipo, idSubTipo } = naventType(prop.type, prop.category);
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
      `        <idTipo>${idTipo}</idTipo>`,
      `        <idSubTipo>${idSubTipo}</idSubTipo>`,
      "      </tipoPropriedade>",
    ].join("\n"),
  );
  lines.push(buildPrecos(prop));
  lines.push(buildCaracteristicas(prop));
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
