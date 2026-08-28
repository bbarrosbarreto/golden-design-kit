import {
  type FaqItem,
  formatCurrency,
  regionWithPreposition,
} from "@/lib/faq";
import type { PropertyType } from "@/lib/property-images";

export interface PropertyFaqInput {
  title: string;
  type: PropertyType | string | null;
  purpose?: "venda" | "aluguel" | null;
  price?: number | null;
  address?: string | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parking_spots?: number | null;
  area?: number | null;
  built_area?: number | null;
  useful_area?: number | null;
  green_area?: number | null;
  region_name?: string | null;
}

function typeLabel(type: PropertyType | string | null): string {
  switch (type) {
    case "apartamento":
      return "Apartamento";
    case "casa":
      return "Casa";
    case "terreno":
      return "Terreno";
    default:
      return "Imóvel";
  }
}

export function suggestPropertyFaq(prop: PropertyFaqInput): FaqItem[] {
  const items: FaqItem[] = [];
  const purposeLabel = prop.purpose === "aluguel" ? "para alugar" : "à venda";
  const typeAndPurpose = `${typeLabel(prop.type)} ${purposeLabel}`;
  const regionPhrase = regionWithPreposition(prop.region_name);

  // 1. Preço
  const priceText =
    prop.price != null
      ? `anunciado por ${formatCurrency(prop.price)}`
      : "com valor sob consulta";
  items.push({
    q: `Quanto custa ${prop.title}?`,
    a: `${typeAndPurpose} ${regionPhrase}, em Brasília/DF, ${priceText}. Para condições de pagamento e propostas, fale com Bruno Barreto, corretor com CRECI-DF 34.060.`,
  });

  // 2. Quartos e banheiros
  const hasBedrooms = prop.bedrooms != null && prop.bedrooms > 0;
  const hasSuites = prop.suites != null && prop.suites > 0;
  const hasBathrooms = prop.bathrooms != null && prop.bathrooms > 0;
  const hasParking = prop.parking_spots != null && prop.parking_spots > 0;
  if (hasBedrooms || hasSuites || hasBathrooms || hasParking) {
    const parts: string[] = [];
    if (hasBedrooms) parts.push(`São ${prop.bedrooms} quartos`);
    if (hasSuites) parts.push(`sendo ${prop.suites} suítes`);
    if (hasBathrooms) parts.push(`${prop.bathrooms} banheiros`);
    if (hasParking) parts.push(`${prop.parking_spots} vagas de garagem`);
    items.push({
      q: `Quantos quartos e banheiros tem ${prop.title}?`,
      a: `${parts.join(", ")}.`,
    });
  }

  // 3. Área
  if (prop.built_area != null || prop.area != null) {
    const built = prop.built_area != null ? `${prop.built_area} m² de área construída` : "";
    const lot = prop.area != null ? `em lote de ${prop.area} m²` : "";
    const sep = built && lot ? ", " : "";
    const areaLabel = prop.type === "terreno" ? "do terreno" : "do imóvel";
    items.push({
      q: `Qual é a área ${areaLabel}?`,
      a: `${built}${sep}${lot}.`.trim(),
    });
  }

  // 4. Endereço
  if (prop.address) {
    items.push({
      q: `Onde fica ${prop.title}?`,
      a: `${prop.address}, ${prop.region_name ?? "Brasília/DF"}, Brasília/DF. [PREENCHER: duas frases sobre a localização — o que existe ao redor, distâncias a pé, acesso viário.]`,
    });
  }

  // 5. Morar na região
  items.push({
    q: `Como é morar ${regionPhrase}?`,
    a: "[PREENCHER: sua leitura da região — perfil das quadras, comércio, escolas, áreas verdes, trânsito. Escreva o que só quem conhece a região sabe dizer.]",
  });

  // 6. Condomínio e IPTU
  if (prop.type !== "terreno") {
    items.push({
      q: `Quanto custa o condomínio e o IPTU ${prop.type === "terreno" ? "do terreno" : "do imóvel"}?`,
      a: "[PREENCHER: valores aproximados e o que está incluso no condomínio.]",
    });
  }

  // 7. Documentação
  items.push({
    q: "O imóvel está escriturado e aceita financiamento?",
    a: "[PREENCHER: situação documental, se aceita financiamento e por quais bancos, e se aceita FGTS.]",
  });

  // 8. Corretor e visita
  items.push({
    q: "Quem é o corretor responsável e como agendar uma visita?",
    a: `Bruno Barreto, corretor de imóveis em Brasília/DF, CRECI-DF 34.060, com atuação ${regionPhrase}. Agendamentos pelo WhatsApp (61) 99935-0888.`,
  });

  return items;
}
