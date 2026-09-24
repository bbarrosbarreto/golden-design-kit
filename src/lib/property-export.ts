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

/**
 * Mapeamento tipo/categoria → campos TipoImovel/SubTipoImovel/CategoriaImovel
 * do feed XML padrão ZAP.
 */
const ZAP_TYPE_MAP: Record<string, { tipo: string; subtipo: string }> = {
  apartamento: { tipo: "Apartamento", subtipo: "Apartamento Padrão" },
  cobertura: { tipo: "Apartamento", subtipo: "Apartamento Padrão" },
  casa: { tipo: "Casa", subtipo: "Casa Padrão" },
  casa_condominio: { tipo: "Casa", subtipo: "Casa de Condomínio" },
  terreno: { tipo: "Terreno", subtipo: "Terreno Padrão" },
  comercial: { tipo: "Comercial/Industrial", subtipo: "Conjunto Comercial/Sala" },
  rural: { tipo: "Rural", subtipo: "Chácara" },
};

const ZAP_CATEGORY_LABELS: Record<string, string> = {
  padrao: "Padrão",
  terrea: "Térrea",
  sobrado_duplex: "Sobrado/Duplex",
  sobrado_triplex: "Sobrado/Triplex",
  cobertura: "Cobertura",
  cobertura_duplex: "Cobertura Duplex",
  cobertura_triplex: "Cobertura Triplex",
};

/** Tipos cuja CategoriaImovel é sempre "Padrão" no feed ZAP. */
const ZAP_FIXED_PADRAO = new Set(["terreno", "comercial", "rural"]);

export function zapPropertyType(
  type: string | null | undefined,
  category: string | null | undefined,
): { tipo: string; subtipo: string; categoria: string } {
  const mapped = ZAP_TYPE_MAP[type ?? ""] ?? ZAP_TYPE_MAP.apartamento;
  const categoria = ZAP_FIXED_PADRAO.has(type ?? "")
    ? "Padrão"
    : (ZAP_CATEGORY_LABELS[category ?? ""] ?? "Padrão");
  return { ...mapped, categoria };
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
  street: string;
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
      label: "Logradouro preenchido",
      ok: input.street.trim() !== "",
      reason: input.street.trim() !== "" ? "Logradouro informado" : "Informe o logradouro",
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

// ---------------------------------------------------------------------------
// Prontidão do FORMULÁRIO (fonte única do painel e da validação de save).
// Não confundir com evaluateReadiness/isReady acima, usadas pelos feeds XML.
// ---------------------------------------------------------------------------

export type FormReadinessInput = {
  title: string;
  description: string;
  street: string;
  neighborhood: string;
  postal_code: string;
  city: string;
  state: string;
  price: string;
  area: string;
  useful_area: string;
  built_area: string;
  green_area: string;
  bedrooms: string;
  bathrooms: string;
  imageCount: number;
  type: string;
  export_portals: string[];
};

/** `field` é o id do input/bloco na tela — usado para rolar e focar. */
export type FormReadinessCheck = {
  field: string;
  label: string;
  ok: boolean;
  reason: string;
};

const RESIDENTIAL_TYPES = new Set([
  "apartamento",
  "cobertura",
  "casa",
  "casa_condominio",
]);

function hasNumber(v: string): boolean {
  return v.trim() !== "" && Number.isFinite(Number(v.trim()));
}

/**
 * Lista ÚNICA de exigências para salvar com a exportação ligada — o painel de
 * prontidão e o bloqueio do save leem daqui, na ordem em que os campos
 * aparecem no formulário. Regra de preço: `price` > 0 é SEMPRE obrigatório
 * (é o valor principal lido por todos os feeds; ver regra no topo do arquivo).
 */
export function evaluateFormReadiness(
  input: FormReadinessInput,
): FormReadinessCheck[] {
  const titleLen = input.title.trim().length;
  const descLen = input.description.trim().length;
  const cep = digitsOnly(input.postal_code);
  const hasArea =
    hasNumber(input.area) ||
    hasNumber(input.useful_area) ||
    hasNumber(input.built_area) ||
    hasNumber(input.green_area);
  const isResidential = RESIDENTIAL_TYPES.has(input.type);
  // Id do primeiro input de área visível para o tipo (apto só tem useful_area).
  const areaField =
    input.type === "apartamento" || input.type === "cobertura"
      ? "useful_area"
      : "area";

  return [
    {
      field: "title",
      label: "Título",
      ok: titleLen >= 10 && titleLen <= 100,
      reason:
        titleLen >= 10 && titleLen <= 100
          ? `${titleLen} caracteres`
          : "Título precisa ter entre 10 e 100 caracteres",
    },
    {
      field: "street",
      label: "Logradouro",
      ok: input.street.trim() !== "",
      reason: input.street.trim() !== "" ? "Logradouro informado" : "Informe o logradouro",
    },
    {
      field: "neighborhood",
      label: "Bairro",
      ok: input.neighborhood.trim() !== "",
      reason: input.neighborhood.trim() !== "" ? "Bairro informado" : "Informe o bairro",
    },
    {
      field: "postal_code",
      label: "CEP",
      ok: cep.length === 8,
      reason: cep.length === 8 ? "CEP válido" : "CEP precisa ter 8 dígitos",
    },
    {
      field: "city",
      label: "Cidade",
      ok: input.city.trim() !== "",
      reason: input.city.trim() !== "" ? "Cidade informada" : "Informe a cidade",
    },
    {
      field: "state",
      label: "Estado",
      ok: input.state.trim() !== "",
      reason: input.state.trim() !== "" ? "Estado informado" : "Informe o estado",
    },
    {
      field: "description",
      label: "Descrição",
      ok: descLen >= 50 && descLen <= 3000,
      reason:
        descLen >= 50 && descLen <= 3000
          ? `${descLen} caracteres`
          : "Descrição precisa ter entre 50 e 3000 caracteres",
    },
    {
      field: "price",
      label: "Preço",
      ok: hasValue(input.price),
      reason: hasValue(input.price) ? "Valor informado" : "Informe um valor maior que zero",
    },
    {
      field: areaField,
      label: "Área",
      ok: hasArea,
      reason: hasArea ? "Área informada" : "Informe ao menos uma área",
    },
    ...(isResidential
      ? [
          {
            field: "bedrooms",
            label: "Quartos",
            ok: hasNumber(input.bedrooms),
            reason: hasNumber(input.bedrooms)
              ? "Quartos informados"
              : "Informe a quantidade de quartos",
          },
          {
            field: "bathrooms",
            label: "Banheiros",
            ok: hasNumber(input.bathrooms),
            reason: hasNumber(input.bathrooms)
              ? "Banheiros informados"
              : "Informe a quantidade de banheiros",
          },
        ]
      : []),
    {
      field: "images",
      label: "Imagens",
      ok: input.imageCount >= 5,
      reason:
        input.imageCount >= 5
          ? `${input.imageCount} imagens`
          : `${input.imageCount} de 5 imagens`,
    },
    {
      field: "export_portals",
      label: "Portal",
      ok: input.export_portals.length > 0,
      reason:
        input.export_portals.length > 0
          ? `${input.export_portals.length} portal(is)`
          : "Selecione ao menos um portal",
    },
  ];
}
