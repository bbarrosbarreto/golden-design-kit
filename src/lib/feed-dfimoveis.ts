/**
 * Gerador do feed XML do DF Imóveis (Integração via XML, Layout do Arquivo v1.6, 04/06/2025).
 *
 * ATENÇÃO: este NÃO é o padrão ZAP. O DF Imóveis tem layout próprio.
 *
 * Pares tipo/subtipo válidos na v1.6 (somente estes):
 *   Apartamento: Padrão, Cobertura, Duplex, Triplex, Mobiliado, Loft
 *   Casa: Padrão, Sobrado, Barracão
 *   Casa Condomínio: Padrão, Sobrado
 *   Sala: Padrão, Andar, Clínica, Consultório
 *   Loja: Padrão, Sobreloja
 *   Rural: Chácara-Sítio, Fazenda
 *   Kitnet: Kitnet-Studio, Mobiliado
 *   Hotel-Flat: Padrão
 *   Ponto Comercial: Pousada, Padaria, Farmácia, Posto de Gasolina, Hotel, Galpão, Padrão, Prédio
 *   Garagem: Padrão
 *   Lote / Loteamento: Residencial, Comercial, Industrial
 *   Predio: Misto, Comercial, Residencial
 *   Galpao: Padrão
 */
import { categoryLabel, type PropImage } from "./property-images";
import {
  cdata,
  escapeXml,
  fetchEligible,
  intOrNull,
  orderedImages,
  passesReadiness,
  tag,
  tagOptional,
} from "./feed-common";
import { selectedFeatures } from "./property-features-feed";

const CRECI = "34060";

// Código de cliente fornecido pelo DF Imóveis para esta conta
const CODIGO_CLIENTE = "10974";

type FeedProperty = {
  listing_code: string | null;
  type: string | null;
  category: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  complement: string | null;
  postal_code: string | null;
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
  title: string | null;
  images: unknown;
  image_category_order: unknown;
  export_portals: string[] | null;
  features: unknown;
  export_highlight_portals: string[] | null;
};

const SELECT_COLUMNS = [
  "listing_code",
  "type",
  "category",
  "state",
  "city",
  "neighborhood",
  "street",
  "complement",
  "postal_code",
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
  "title",
  "images",
  "image_category_order",
  "export_portals",
  "features",
  "export_highlight_portals",
].join(",");

/** Tabela oficial do anexo 01 da documentação do DF Imóveis. */
export function dfPropertyType(
  type: string | null,
  category: string | null,
): { tipo: string; subtipo: string } | null {
  const cat = (category ?? "").toLowerCase();
  const sobrado = cat.startsWith("sobrado") ? "Sobrado" : "Padrão";
  switch (type) {
    case "apartamento": {
      const sub: Record<string, string> = {
        cobertura: "Cobertura",
        duplex: "Duplex",
        triplex: "Triplex",
        mobiliado: "Mobiliado",
        loft: "Loft",
      };
      const key = Object.keys(sub).find((k) => cat.startsWith(k));
      return { tipo: "Apartamento", subtipo: key ? sub[key] : "Padrão" };
    }
    case "cobertura":
      return { tipo: "Apartamento", subtipo: "Cobertura" };
    case "casa":
      return { tipo: "Casa", subtipo: sobrado };
    case "casa_condominio":
      return { tipo: "Casa Condomínio", subtipo: sobrado };
    case "terreno":
      return { tipo: "Lote", subtipo: "Residencial" };
    case "comercial":
      return { tipo: "Sala", subtipo: "Padrão" };
    case "rural":
      return { tipo: "Rural", subtipo: "Chácara-Sítio" };
    default:
      return null;
  }
}

const TYPES_WITH_LAND = new Set(["casa", "casa_condominio", "terreno", "rural"]);

/** Áreas obrigatórias na v1.6. Inteiros; null quando não há valor (nunca 0). */
export function dfAreas(prop: {
  type: string | null;
  area: number | null;
  useful_area: number | null;
  built_area: number | null;
}): { util: number | null; total: number | null; terreno: number | null } {
  const pos = (v: number | null) => {
    const n = intOrNull(v);
    return n !== null && n > 0 ? n : null;
  };
  const util = pos(prop.useful_area) ?? pos(prop.built_area) ?? pos(prop.area);
  const total = pos(prop.area) ?? util;
  const terreno = prop.type && TYPES_WITH_LAND.has(prop.type) ? pos(prop.area) : null;
  return { util, total, terreno };
}

function buildImovel(prop: FeedProperty, images: PropImage[]): string {
  const { tipo, subtipo } = dfPropertyType(prop.type, prop.category)!;
  const lines: (string | null)[] = [];

  lines.push(tag("CodigoCliente", CODIGO_CLIENTE));
  lines.push(tagOptional("CodigoImovel", (prop.listing_code ?? "").slice(0, 10)));
  lines.push(tag("TipoImovel", tipo));
  lines.push(tag("SubTipoImovel", subtipo));
  lines.push(tag("Creci", CRECI));
  lines.push(tagOptional("Uf", prop.state));
  lines.push(tagOptional("Cidade", prop.city));
  if (prop.neighborhood) {
    lines.push(`      <Bairro>${cdata(prop.neighborhood)}</Bairro>`);
  }
  const cep = (prop.postal_code ?? "").replace(/\D/g, "");
  lines.push(tagOptional("CEP", cep.length === 8 ? cep : null));
  lines.push(tagOptional("Endereco", prop.street));
  lines.push(tagOptional("Complemento", prop.complement));
  lines.push(tag("ExibirComplemento", 0));

  if (prop.purpose === "aluguel") {
    const locacao = intOrNull(prop.price);
    if (locacao !== null) lines.push(tag("PrecoLocacao", locacao));
  } else {
    const venda = intOrNull(prop.price);
    if (venda !== null) lines.push(tag("PrecoVenda", venda));
    const locacao = intOrNull(prop.rent_price);
    if (locacao !== null && locacao > 0) lines.push(tag("PrecoLocacao", locacao));
  }

  lines.push(tagOptional("PrecoCondominio", intOrNull(prop.condo_fee)));
  lines.push(tagOptional("PrecoIptu", intOrNull(prop.iptu)));

  const areas = dfAreas(prop);
  lines.push(tagOptional("AreaUtil", areas.util));
  lines.push(tagOptional("AreaTotal", areas.total));
  lines.push(tagOptional("AreaDoTerreno", areas.terreno));
  lines.push(tag("UnidadeMetrica", "M2"));

  // Destaque: só "1", nunca "0" (omitido quando não é destaque). Posição é
  // escolha nossa: a tabela da v1.6 lista Destaque entre Longitude e
  // QtdDormitorios; como não enviamos Longitude, a tag fica colada antes de
  // QtdDormitorios. Nossa ordem já difere da tabela em outros pontos e o
  // portal aceita. UltraDestaque é exclusivo do 62imoveis: não enviar.
  if ((prop.export_highlight_portals ?? []).includes("dfimoveis")) {
    lines.push(tag("Destaque", 1));
  }

  lines.push(tagOptional("QtdDormitorios", prop.bedrooms));
  lines.push(tagOptional("QtdSuites", prop.suites));
  lines.push(tagOptional("QtdBanheiros", prop.bathrooms));
  lines.push(tagOptional("QtdVagas", prop.parking_spots));
  lines.push(tagOptional("QtdSalas", prop.living_rooms));

  const ano = intOrNull(prop.year_built);
  lines.push(tagOptional("AnoConstrucao", ano !== null && ano >= 1000 && ano <= 9999 ? ano : null));

  if (prop.description) {
    lines.push(`      <Observacao>${cdata(prop.description.slice(0, 5000))}</Observacao>`);
  }
  lines.push(tag("AceitaFinanciamento", 1));

  // Características marcadas: <Tag>1</Tag>, sem repetir (Piscina/Churrasqueira).
  const emitidas = new Set<string>();
  for (const feat of selectedFeatures(prop.features)) {
    if (feat.df === null || emitidas.has(feat.df)) continue;
    emitidas.add(feat.df);
    lines.push(tag(feat.df, 1));
  }

  const fotos = images
    .map((img) =>
      [
        "        <Foto>",
        `          <NomeArquivo>${escapeXml(categoryLabel(img.category, prop.type))}</NomeArquivo>`,
        `          <URLArquivo>${escapeXml(img.url)}</URLArquivo>`,
        "        </Foto>",
      ].join("\n"),
    )
    .join("\n");
  lines.push(`      <Fotos>\n${fotos}\n      </Fotos>`);

  return ["    <Imovel>", ...lines.filter((l): l is string => l !== null), "    </Imovel>"].join(
    "\n",
  );
}

export async function generateDfImoveisFeed(portal: string): Promise<string> {
  let imoveisXml = "";
  try {
    const rows = await fetchEligible<FeedProperty>(portal, SELECT_COLUMNS);
    const imoveis: string[] = [];
    for (const prop of rows) {
      const images = orderedImages(prop);
      const hasArea = prop.area != null || prop.useful_area != null || prop.built_area != null;
      if (!hasArea) continue;
      if (!dfPropertyType(prop.type, prop.category)) {
        console.warn(`[feed-dfimoveis] tipo sem correspondência na v1.6, omitido: ${prop.listing_code} (${prop.type})`);
        continue;
      }
      if (!passesReadiness(prop, images.length)) continue;
      imoveis.push(buildImovel(prop, images));
    }
    imoveisXml = imoveis.join("\n");
  } catch {
    // Falha de rede/parse: devolve feed vazio em vez de erro.
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Carga xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '       xmlns:xsd="http://www.w3.org/2001/XMLSchema">',
    "  <Imoveis>",
    imoveisXml,
    "  </Imoveis>",
    "</Carga>",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
