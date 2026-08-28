export type PropImage = { url: string; category: string; order: number };
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
    { value: "jardim", label: "Jardim" },
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

export function categoryLabel(
  category: string,
  type?: PropertyType | string | null,
): string {
  return categoriesFor(type).find((c) => c.value === category)?.label ?? category;
}

const SECTION_LABELS: Record<string, string> = {
  fachada: "Fachada",
  sala: "Salas",
  cozinha: "Cozinha",
  quarto: "Quartos",
  banheiro: "Banheiros",
  area_comum: "Lazer e Áreas Comuns",
  area_externa: "Área Externa",
  jardim: "Jardim",
  area_servico: "Área de Serviço",
  espacos_lazer: "Espaços de Lazer",
  demais_espacos: "Demais Espaços",
  frente: "Frente",
  fundo: "Fundo",
  lateral: "Lateral",
  vista_aerea: "Vista Aérea",
  entorno: "Entorno",
  planta: "Plantas",
  outros: "Galeria",
};

const SINGULAR_LABELS: Record<string, string> = {
  capa: "Capa",
  fachada: "Fachada",
  sala: "Sala",
  cozinha: "Cozinha",
  quarto: "Quarto",
  banheiro: "Banheiro",
  area_comum: "Área Comum",
  area_externa: "Área Externa",
  jardim: "Jardim",
  area_servico: "Área de Serviço",
  espacos_lazer: "Espaço de Lazer",
  demais_espacos: "Demais Espaços",
  frente: "Frente",
  fundo: "Fundo",
  lateral: "Lateral",
  vista_aerea: "Vista Aérea",
  entorno: "Entorno",
  planta: "Planta",
  outros: "Foto",
};

export function sectionLabel(
  category: string,
  type?: PropertyType | string | null,
): string {
  return (
    SECTION_LABELS[category] ??
    categoriesFor(type).find((c) => c.value === category)?.label ??
    "Galeria"
  );
}

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  quintal: "jardim",
};

export function normalizePropImages(
  input: unknown,
  type?: PropertyType | string | null,
): PropImage[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set(categoriesFor(type as PropertyType).map((c) => c.value));
  const out: PropImage[] = [];
  // Guarda o maior "order" já usado por categoria para preencher os ausentes.
  const maxByCategory = new Map<string, number>();
  const pending: { image: PropImage; hasOrder: boolean }[] = [];

  for (const item of input) {
    let url: string | null = null;
    let rawCat = "";
    let rawOrder: unknown = undefined;

    if (typeof item === "string") {
      url = item;
    } else if (item && typeof item === "object" && "url" in item) {
      const u = (item as { url: unknown }).url;
      if (typeof u === "string") url = u;
      const c = (item as { category?: unknown }).category;
      rawCat = typeof c === "string" ? c : "";
      rawOrder = (item as { order?: unknown }).order;
    }
    if (!url) continue;

    const mapped = LEGACY_CATEGORY_MAP[rawCat] ?? rawCat;
    const category = valid.has(mapped) ? mapped : "outros";

    const num = typeof rawOrder === "number" ? rawOrder : Number(rawOrder);
    const hasOrder =
      rawOrder !== undefined &&
      rawOrder !== null &&
      rawOrder !== "" &&
      Number.isFinite(num) &&
      Math.trunc(num) >= 1;
    const order = hasOrder ? Math.trunc(num) : 0;

    if (hasOrder) {
      maxByCategory.set(category, Math.max(maxByCategory.get(category) ?? 0, order));
    }
    pending.push({ image: { url, category, order }, hasOrder });
  }

  for (const { image, hasOrder } of pending) {
    if (!hasOrder) {
      const next = (maxByCategory.get(image.category) ?? 0) + 1;
      maxByCategory.set(image.category, next);
      image.order = next;
    }
    out.push(image);
  }

  return out;
}

export function nextOrderFor(images: PropImage[], category: string): number {
  return (
    images
      .filter((i) => i.category === category)
      .reduce((max, i) => Math.max(max, i.order ?? 0), 0) + 1
  );
}

export function defaultCategoryOrder(type?: PropertyType | string | null): string[] {
  return categoriesFor(type).map((c) => c.value);
}

export function resolveCategoryOrder(
  type: PropertyType | string | null | undefined,
  saved?: unknown,
): string[] {
  const all = defaultCategoryOrder(type).filter((c) => c !== "capa");
  const valid = new Set(all);
  const result: string[] = [];
  if (Array.isArray(saved)) {
    for (const s of saved) {
      if (typeof s === "string" && valid.has(s) && !result.includes(s)) result.push(s);
    }
  }
  for (const c of all) if (!result.includes(c)) result.push(c);
  return result;
}

export function groupImagesByCategory(
  images: PropImage[],
  type?: PropertyType | string | null,
  savedOrder?: unknown,
): { category: string; label: string; images: PropImage[] }[] {
  const order = resolveCategoryOrder(type, savedOrder);
  return order
    .map((category) => ({
      category,
      label: categoryLabel(category, type),
      images: images
        .filter((i) => i.category === category)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }))
    .filter((g) => g.images.length > 0);
}

export function findDuplicateOrders(images: PropImage[]): { category: string; order: number }[] {
  const counts = new Map<string, number>();
  for (const i of images) {
    const key = `${i.category}::${i.order}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const dups: { category: string; order: number }[] = [];
  for (const [key, count] of counts) {
    if (count > 1) {
      const idx = key.lastIndexOf("::");
      dups.push({ category: key.slice(0, idx), order: Number(key.slice(idx + 2)) });
    }
  }
  return dups;
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
