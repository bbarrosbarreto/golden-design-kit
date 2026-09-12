/**
 * Exportação de anúncios para portais imobiliários (DF Imóveis, ZAP/VivaReal/OLX).
 *
 * REGRA DE PREÇO (usada pelo gerador de XML na Etapa 2):
 * - purpose = 'venda'   → `price` é o valor de VENDA.
 * - purpose = 'aluguel' → `price` é o valor do ALUGUEL MENSAL.
 * - `rent_price` é usado APENAS quando o imóvel é de venda e também está
 *   disponível para locação. Quando purpose = 'aluguel', `rent_price` é null.
 */

export const EXPORT_PORTALS = [
  { value: "dfimoveis", label: "DF Imóveis" },
  { value: "wimoveis", label: "Wimóveis" },
  { value: "grupozap", label: "ZAP / VivaReal / OLX" },
] as const;

/** Espelha exatamente o check constraint de `properties.category` (7 valores). */
export const LISTING_CATEGORIES = [
  { value: "padrao", label: "Padrão" },
  { value: "terrea", label: "Térrea" },
  { value: "sobrado_duplex", label: "Sobrado/Duplex" },
  { value: "sobrado_triplex", label: "Sobrado/Triplex" },
  { value: "cobertura", label: "Cobertura" },
  { value: "cobertura_duplex", label: "Cobertura Duplex" },
  { value: "cobertura_triplex", label: "Cobertura Triplex" },
] as const;

/**
 * Categorias válidas por tipo de imóvel — os portais recusam combinações
 * como apartamento + sobrado_duplex.
 */
const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  apartamento: ["padrao", "cobertura", "cobertura_duplex", "cobertura_triplex"],
  cobertura: ["cobertura", "cobertura_duplex", "cobertura_triplex"],
  casa: ["terrea", "sobrado_duplex", "sobrado_triplex"],
  casa_condominio: ["terrea", "sobrado_duplex", "sobrado_triplex"],
  terreno: ["padrao"],
  comercial: ["padrao", "terrea", "sobrado_duplex"],
  rural: ["padrao"],
};

export function categoriesForType(type: string | null | undefined) {
  const allowed = CATEGORIES_BY_TYPE[type ?? ""] ?? CATEGORIES_BY_TYPE.apartamento;
  return LISTING_CATEGORIES.filter((c) => allowed.includes(c.value));
}

export function firstCategoryFor(type: string | null | undefined): string {
  return categoriesForType(type)[0]?.value ?? "padrao";
}

export function isCategoryValidFor(
  type: string | null | undefined,
  category: string | null | undefined,
): boolean {
  return categoriesForType(type).some((c) => c.value === category);
}

/** Mantém só os dígitos do CEP — no banco gravamos 8 dígitos, sem traço. */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 8);
}

/** Máscara 00000-000 apenas para exibição no input. */
export function formatPostalCode(value: string | null | undefined): string {
  const d = digitsOnly(value);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export type ReadinessInput = {
  postal_code: string;
  neighborhood: string;
  description: string;
  imageCount: number;
  title: string;
  price: string;
  rent_price: string;
  export_portals: string[];
};

export type ReadinessCheck = { label: string; ok: boolean; reason: string };

function hasValue(v: string): boolean {
  const n = Number(v.trim());
  return v.trim() !== "" && Number.isFinite(n) && n > 0;
}

export function evaluateReadiness(input: ReadinessInput): ReadinessCheck[] {
  const cep = digitsOnly(input.postal_code);
  const desc = input.description.trim().length;
  const title = input.title.trim().length;

  return [
    {
      label: "CEP preenchido",
      ok: cep.length === 8,
      reason: cep.length === 8 ? "CEP válido" : "Informe os 8 dígitos do CEP",
    },
    {
      label: "Bairro preenchido",
      ok: input.neighborhood.trim() !== "",
      reason: input.neighborhood.trim() !== "" ? "Bairro informado" : "Informe o bairro",
    },
    {
      label: "Descrição entre 50 e 3000 caracteres",
      ok: desc >= 50 && desc <= 3000,
      reason:
        desc < 50
          ? `Faltam ${50 - desc} caracteres`
          : desc > 3000
            ? `Excedeu em ${desc - 3000} caracteres`
            : `${desc} caracteres`,
    },
    {
      label: "Pelo menos 5 imagens",
      ok: input.imageCount >= 5,
      reason:
        input.imageCount >= 5
          ? `${input.imageCount} imagens`
          : `${input.imageCount} de 5 imagens`,
    },
    {
      label: "Título entre 10 e 100 caracteres",
      ok: title >= 10 && title <= 100,
      reason:
        title < 10
          ? `Faltam ${10 - title} caracteres`
          : title > 100
            ? `Excedeu em ${title - 100} caracteres`
            : `${title} caracteres`,
    },
    {
      label: "Preço de venda ou de aluguel preenchido",
      ok: hasValue(input.price) || hasValue(input.rent_price),
      reason:
        hasValue(input.price) || hasValue(input.rent_price)
          ? "Valor informado"
          : "Informe um valor maior que zero",
    },
    {
      label: "Ao menos um portal selecionado",
      ok: input.export_portals.length > 0,
      reason:
        input.export_portals.length > 0
          ? `${input.export_portals.length} portal(is)`
          : "Selecione ao menos um portal",
    },
  ];
}

export function isReady(checks: ReadinessCheck[]): boolean {
  return checks.every((c) => c.ok);
}
