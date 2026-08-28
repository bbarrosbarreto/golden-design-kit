export interface FaqItem {
  q: string;
  a: string;
}

export function normalizeFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  const out: FaqItem[] = [];
  for (const item of value) {
    if (item && typeof item === "object") {
      const q = (item as { q?: unknown }).q;
      const a = (item as { a?: unknown }).a;
      if (typeof q === "string" && typeof a === "string") {
        out.push({ q: q.trim(), a: a.trim() });
      }
    }
  }
  return out;
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function sameQuestion(a: string, b: string): boolean {
  return stripAccents(a).trim().toLowerCase() === stripAccents(b).trim().toLowerCase();
}

const REGION_PREPOSITIONS: Record<string, string> = {
  "asa-norte": "na",
  "asa-sul": "na",
  "lago-norte": "no",
  "lago-sul": "no",
  "noroeste": "no",
  "sudoeste": "no",
  "cruzeiro": "no",
  "guara": "no",
  "nucleo-bandejante": "no",
  "jardim-botanico": "no",
};

export function regionPreposition(regionName: string | null | undefined): string {
  if (!regionName) return "em";
  const key = stripAccents(regionName).trim().toLowerCase().replace(/\s+/g, "-");
  return REGION_PREPOSITIONS[key] ?? "em";
}

export function regionWithPreposition(regionName: string | null | undefined): string {
  if (!regionName) return "em Brasília/DF";
  const prep = regionPreposition(regionName);
  return `${prep} ${regionName}`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
