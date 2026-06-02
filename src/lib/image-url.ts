/**
 * Helper para URLs de imagens.
 *
 * Anteriormente aplicava otimização automática via Supabase Image
 * Transformations (WebP + redimensionamento), mas esse recurso requer
 * plano pago do Supabase. Por enquanto retorna a URL original.
 *
 * Se no futuro quiser reativar, basta reescrever para o endpoint
 * /storage/v1/render/image/public/ com os parâmetros de transformação.
 */

type Opts = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

export function optimizedImageUrl(url: string | null | undefined, _opts: Opts = {}): string {
  return url ?? "";
}
