import {
  type FaqItem,
  formatCurrency,
  regionWithPreposition,
} from "@/lib/faq";

export interface DevelopmentFaqInput {
  title: string;
  status?: "pronta_entrega" | "previsao" | string | null;
  delivery_date?: string | null;
  builder?: string | null;
  price_from?: number | null;
  area_from?: number | null;
  area_to?: number | null;
  typology?: string[] | null;
  region_name?: string | null;
}

function deliveryLabel(dev: DevelopmentFaqInput): string | null {
  if (dev.status === "pronta_entrega") return "Pronta entrega";
  if (dev.status === "previsao" && dev.delivery_date) {
    const date = new Date(dev.delivery_date);
    const label = date.toLocaleDateString("pt-BR", {
      month: "2-digit",
      year: "numeric",
    });
    return label === "Invalid Date" ? null : `Entrega prevista para ${label}`;
  }
  return null;
}

export function suggestDevelopmentFaq(dev: DevelopmentFaqInput): FaqItem[] {
  const items: FaqItem[] = [];
  const regionPhrase = regionWithPreposition(dev.region_name);

  // 1. Preço
  const priceText =
    dev.price_from != null
      ? `a partir de ${formatCurrency(dev.price_from)}`
      : "com valores sob consulta";
  items.push({
    q: `Quanto custa um apartamento no ${dev.title}?`,
    a: `Empreendimento ${priceText}. Para condições de pagamento e propostas, fale com Bruno Barreto, corretor com CRECI-DF 34.060.`,
  });

  // 2. Tipologias e metragens
  const hasTypology = dev.typology && dev.typology.length > 0;
  const hasArea = dev.area_from != null || dev.area_to != null;
  if (hasTypology || hasArea) {
    const parts: string[] = [];
    if (hasTypology) parts.push(`Tipologias: ${dev.typology!.join(", ")}`);
    if (dev.area_from != null && dev.area_to != null) {
      parts.push(`áreas de ${dev.area_from} a ${dev.area_to} m²`);
    } else if (dev.area_from != null) {
      parts.push(`área a partir de ${dev.area_from} m²`);
    } else if (dev.area_to != null) {
      parts.push(`área até ${dev.area_to} m²`);
    }
    items.push({
      q: `Quais são as tipologias e metragens do ${dev.title}?`,
      a: `${parts.join(" — ")}.`.trim(),
    });
  }

  // 3. Entrega
  const delivery = deliveryLabel(dev);
  if (delivery) {
    items.push({
      q: `Quando o ${dev.title} será entregue?`,
      a: `${delivery}.`,
    });
  }

  // 4. Construtora
  if (dev.builder) {
    items.push({
      q: `Quem é a construtora do ${dev.title}?`,
      a: `${dev.builder}.`,
    });
  }

  // 5. Onde fica
  items.push({
    q: `Onde fica o ${dev.title}?`,
    a: `${regionPhrase}, em Brasília/DF. [PREENCHER: duas frases sobre o entorno — acesso viário, comércio, escolas, áreas verdes e mobilidade.]`,
  });

  // 6. Área de lazer
  items.push({
    q: `Qual é a área de lazer do ${dev.title}?`,
    a: "[PREENCHER: descreva as áreas comuns de lazer, equipamentos, espaços gourmet, piscina, academia, etc.]",
  });

  // 7. Morar na região
  items.push({
    q: `Como é morar ${regionPhrase}?`,
    a: "[PREENCHER: sua leitura da região — perfil das quadras, comércio, escolas, áreas verdes, trânsito. Escreva o que só quem conhece a região sabe dizer.]",
  });

  // 8. Corretor e visita
  items.push({
    q: "Quem é o corretor e como agendar uma visita?",
    a: `Bruno Barreto, corretor de imóveis em Brasília/DF, CRECI-DF 34.060, com atuação ${regionPhrase}. Agendamentos pelo WhatsApp (61) 99935-0888.`,
  });

  return items;
}
