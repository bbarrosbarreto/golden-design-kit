export type DevImage = { url: string; category: string };

export const IMAGE_CATEGORIES: { value: string; label: string }[] = [
  { value: "capa", label: "Capa" },
  { value: "fachada", label: "Fachada" },
  { value: "area_comum", label: "Lazer e Áreas Comuns" },
  { value: "planta", label: "Planta" },
  { value: "apartamento", label: "Apartamento" },
  { value: "outros", label: "Outros" },
];

export function pickCoverImage(input: unknown): DevImage | null {
  const list = normalizeImages(input);
  if (list.length === 0) return null;
  return (
    list.find((i) => i.category === "capa") ??
    list.find((i) => i.category === "fachada") ??
    list[0]
  );
}

export function orderedImages(input: unknown): DevImage[] {
  const list = normalizeImages(input);
  const cover = pickCoverImage(list);
  if (!cover) return list;
  const rest = list.filter((i) => i !== cover);
  return [cover, ...rest];
}

const VALID = new Set(IMAGE_CATEGORIES.map((c) => c.value));

export function normalizeImages(input: unknown): DevImage[] {
  if (!Array.isArray(input)) return [];
  const out: DevImage[] = [];
  for (const item of input) {
    if (typeof item === "string") {
      out.push({ url: item, category: "outros" });
    } else if (item && typeof item === "object" && "url" in item) {
      const url = (item as { url: unknown }).url;
      const cat = (item as { category?: unknown }).category;
      if (typeof url === "string") {
        const rawCat = typeof cat === "string" ? cat : "";
        const mappedCat = rawCat === "lazer" ? "area_comum" : rawCat;
        const category = VALID.has(mappedCat) ? mappedCat : "outros";
        out.push({ url, category });
      }
    }
  }
  return out;
}

export function imageUrls(input: unknown): string[] {
  return normalizeImages(input).map((i) => i.url);
}

export function categoryLabel(value: string): string {
  return IMAGE_CATEGORIES.find((c) => c.value === value)?.label ?? "Outros";
}

const SINGULAR_LABELS: Record<string, string> = {
  capa: "Capa",
  fachada: "Fachada",
  area_comum: "Área Comum",
  planta: "Planta",
  apartamento: "Apartamento",
  outros: "Foto",
};

/**
 * Alt descritivo para fotos de empreendimentos:
 * "{Categoria} — {título}", acrescentando " (foto N)" quando a categoria
 * tem 2+ fotos. `photoNumber` é 1-based (posição da foto dentro da categoria).
 */
export function imageAlt(
  img: DevImage,
  developmentTitle: string,
  photoNumber: number,
  categoryCount: number,
): string {
  const label = SINGULAR_LABELS[img.category] ?? categoryLabel(img.category);
  return categoryCount > 1
    ? `${label} — ${developmentTitle} (foto ${photoNumber})`
    : `${label} — ${developmentTitle}`;
}
