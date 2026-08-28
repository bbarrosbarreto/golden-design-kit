export type PropImage = { url: string; category: string };
export type PropertyType = "apartamento" | "casa" | "terreno";

const COMMON_END = [
  { value: "planta", label: "Planta" },
  { value: "outros", label: "Outros" },
];

const EXTRA_CATEGORIES = [
  { value: "area_servico", label: "Área de Serviço" },
  { value: "espacos_lazer", label: "Espaços de Lazer" },
  { value: "demais_espacos", label: "Demais Espaços" },
];

export const PROPERTY_CATEGORIES: Record<PropertyType, { value: string; label: string }[]> = {
  apartamento: [
    { value: "capa", label: "Capa" },
    { value: "fachada", label: "Fachada" },
    { value: "sala", label: "Sala" },
    { value: "cozinha", label: "Cozinha" },
    { value: "quarto", label: "Quarto" },
    { value: "banheiro", label: "Banheiro" },
    { value: "area_comum", label: "Lazer e Áreas Comuns" },
    ...EXTRA_CATEGORIES,
    ...COMMON_END,
  ],
  casa: [
    { value: "capa", label: "Capa" },
    { value: "fachada", label: "Fachada" },
    { value: "sala", label: "Sala" },
    { value: "cozinha", label: "Cozinha" },
    { value: "quarto", label: "Quarto" },
    { value: "banheiro", label: "Banheiro" },
    { value: "area_externa", label: "Área Externa" },
    { value: "quintal", label: "Quintal" },
    ...EXTRA_CATEGORIES,
    ...COMMON_END,
  ],
  terreno: [
    { value: "capa", label: "Capa" },
    { value: "frente", label: "Frente" },
    { value: "fundo", label: "Fundo" },
    { value: "lateral", label: "Lateral" },
    { value: "vista_aerea", label: "Vista Aérea" },
    { value: "entorno", label: "Entorno" },
    { value: "outros", label: "Outros" },
  ],
};

export function categoriesFor(type: PropertyType | string | null | undefined) {
  const t = (type ?? "apartamento") as PropertyType;
  return PROPERTY_CATEGORIES[t] ?? PROPERTY_CATEGORIES.apartamento;
}

export function normalizePropImages(input: unknown, type?: PropertyType | string | null): PropImage[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set(categoriesFor(type as PropertyType).map((c) => c.value));
  const out: PropImage[] = [];
  for (const item of input) {
    if (typeof item === "string") {
      out.push({ url: item, category: "outros" });
    } else if (item && typeof item === "object" && "url" in item) {
      const url = (item as { url: unknown }).url;
      const cat = (item as { category?: unknown }).category;
      if (typeof url === "string") {
        const c = typeof cat === "string" ? cat : "";
        out.push({ url, category: valid.has(c) ? c : "outros" });
      }
    }
  }
  return out;
}

export function pickPropCover(input: unknown, type?: PropertyType | string | null): PropImage | null {
  const list = normalizePropImages(input, type);
  if (list.length === 0) return null;
  return (
    list.find((i) => i.category === "capa") ??
    list.find((i) => i.category === "fachada" || i.category === "frente") ??
    list[0]
  );
}
