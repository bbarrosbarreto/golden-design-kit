/**
 * Gerador do feed XML do DF Imóveis (Integração via XML, Layout do Arquivo v1.1).
 *
 * ATENÇÃO: este NÃO é o padrão ZAP. O DF Imóveis tem layout próprio, com
 * nomes de tags diferentes (Uf, PrecoLocacao, PrecoIptu, ExibirComplemento)
 * e sem CategoriaImovel, TipoOferta, Numero, coordenadas ou vídeos.
 * O gerador do padrão ZAP (feed-zap.ts) continua servindo outros portais.
 *
 * Subtipos disponíveis na documentação, para uso futuro:
 *   Apartamento: Padrao, Cobertura, Duplex, Triplex, Mobiliado, Loft
 *   Casa: Térrea, Sobrado, Condomínio, Barracão
 *   Sala: Sala, Andar, Clínica, Consultório
 *   Loja: Loja, Sobreloja
 *   Hotel-Flat: Hotel-Flat
 *   Rural: Chácara-Sítio, Fazenda
 *   Kitnet: Kitnet-Studio, Mobiliado
 *   Ponto Comercial: Pousada, Padaria, Farmácia, Posto de Gasolina, Hotel,
 *                    Galpão, Ponto Comercial, Prédio
 *   Garagem: Garagem
 *   Lote: Lote Residencial, Lote Comercial, Lote Industrial
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

const CRECI = "34060";

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
].join(",");

/** Tabela oficial do anexo 01 da documentação do DF Imóveis. */
function dfPropertyType(
  type: string | null,
  category: string | null,
): { tipo: string; subtipo: string } {
  const cat = category ?? "";
  switch (type) {
    case "apartamento":
      return {
        tipo: "Apartamento",
        subtipo: cat.startsWith("cobertura") ? "Cobertura" : "Padrao",
      };
    case "cobertura":
      return { tipo: "Apartamento", subtipo: "Cobertura" };
    case "casa":
      return {
        tipo: "Casa",
        subtipo: cat.startsWith("sobrado") ? "Sobrado" : "Térrea",
      };
    case "casa_condominio":
      return { tipo: "Casa", subtipo: "Condomínio" };
    case "terreno":
      return { tipo: "Lote", subtipo: "Lote Residencial" };
    case "comercial":
      return { tipo: "Sala", subtipo: "Sala" };
    case "rural":
      return { tipo: "Rural", subtipo: "Chácara-Sítio" };
    default:
      return { tipo: "Apartamento", subtipo: "Padrao" };
  }
}

function buildImovel(prop: FeedProperty, images: PropImage[]): string {
  const { tipo, subtipo } = dfPropertyType(prop.type, prop.category);
  const lines: (string | null)[] = [];

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

  const areaUtil = intOrNull(prop.useful_area ?? prop.built_area);
  // AreaTotal é obrigatória no layout do DF Imóveis: sem `area`, cai na útil.
  const areaTotal = intOrNull(prop.area) ?? areaUtil;
  lines.push(tagOptional("AreaUtil", areaUtil));
  lines.push(tagOptional("AreaTotal", areaTotal));
  if (prop.type === "terreno" || prop.type === "rural") {
    lines.push(tagOptional("AreaDoTerreno", intOrNull(prop.area)));
  }
  lines.push(tag("UnidadeMetrica", "M2"));

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
