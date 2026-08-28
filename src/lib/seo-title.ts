function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Monta o título SEO de páginas de detalhe (imóveis e empreendimentos).
 * Regras: limite de 65 caracteres; região omitida quando já aparece no
 * título (sem acentos/case); sufixo " | Bruno Barreto"; se estourar,
 * descarta a região antes de truncar o título; corte na última palavra
 * inteira, sem pontuação solta antes de "…".
 */
export function buildSeoTitle(input: {
  title: string;
  region?: string | null;
}): string {
  const { title, region } = input;
  const suffix = " | Bruno Barreto";

  const regionSegment =
    region && !normalizeText(title).includes(normalizeText(region))
      ? ` | ${region}`
      : "";

  const full = `${title}${regionSegment}${suffix}`;
  if (full.length <= 65) return full;

  const withoutRegion = `${title}${suffix}`;
  if (withoutRegion.length <= 65) return withoutRegion;

  const maxTitle = 65 - suffix.length - 1; // reserve 1 char for ellipsis
  let truncated = title.slice(0, Math.max(0, maxTitle)).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
  truncated = truncated.replace(/[\s+\-,;:/&]+$/, "");

  return `${truncated}…${suffix}`;
}
