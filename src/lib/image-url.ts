/**
 * Otimização automática de imagens via Supabase Image Transformations.
 *
 * Reescreve URLs públicas do Storage (/storage/v1/object/public/...) para o
 * endpoint de transformação (/storage/v1/render/image/public/...) que serve
 * WebP automaticamente quando o navegador suporta (via header Accept), além
 * de redimensionar para o tamanho exibido — reduzindo drasticamente o peso
 * das imagens entregues.
 *
 * Requer Image Transformations habilitado no projeto Supabase (add-on pago).
 * Para URLs externas ou não-Supabase, retorna a URL original sem alterações.
 */

type Opts = {
  width?: number;
  height?: number;
  quality?: number; // 20-100, default 75
  resize?: "cover" | "contain" | "fill";
};

export function optimizedImageUrl(url: string | null | undefined, opts: Opts = {}): string {
  if (!url) return "";
  // Só transforma URLs do Supabase Storage public
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const base = url.slice(0, idx);
  const path = url.slice(idx + marker.length);
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  params.set("quality", String(opts.quality ?? 75));
  if (opts.resize) params.set("resize", opts.resize);

  return `${base}/storage/v1/render/image/public/${path}?${params.toString()}`;
}
