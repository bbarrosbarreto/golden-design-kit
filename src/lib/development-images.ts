export type DevImage = { url: string; category: string };

export const IMAGE_CATEGORIES: { value: string; label: string }[] = [
  { value: "fachada", label: "Fachada" },
  { value: "area_comum", label: "Área Comum" },
  { value: "lazer", label: "Lazer" },
  { value: "planta", label: "Planta" },
  { value: "apartamento", label: "Apartamento" },
  { value: "outros", label: "Outros" },
];

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
        out.push({
          url,
          category:
            typeof cat === "string" && VALID.has(cat) ? cat : "outros",
        });
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
