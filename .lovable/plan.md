# Migrar `/empreendimentos/$slug` para SSR (mesmo padrão de imóveis)

## Arquivos

1. `src/lib/seo-title.ts` (novo) — helper compartilhado
2. `src/lib/development-images.ts` — função `imageAlt`
3. `src/routes/empreendimentos.$slug.tsx` — loader + head + alts

## 1. Helper de título compartilhado — `src/lib/seo-title.ts`

Extrair a lógica de `buildTitle` (hoje local em `imoveis.$slug.tsx`, linhas 83–115) para um módulo compartilhado, generalizando a assinatura para qualquer entidade com título e região:

```ts
export function buildSeoTitle(input: {
  title: string;
  region?: string | null;
}): string
```

Regras preservadas exatamente: limite de 65 caracteres, região omitida quando já aparece no título (comparação sem acentos/case via `normalizeText`), sufixo `" | Bruno Barreto"`, remoção do segmento de região antes de truncar o título, corte na última palavra inteira, limpeza de pontuação solta (`/[\s+\-,;:/&]+$/`) antes de "…".

**Não alterar `imoveis.$slug.tsx`** (regra do escopo): a cópia local dele permanece; a migração dele para o helper fica como débito técnico opcional futuro.

## 2. `imageAlt` em `src/lib/development-images.ts`

Espelhar o padrão de `property-images.ts` (`SINGULAR_LABELS` + `imageAlt`), usando as categorias de empreendimento já existentes no módulo:

```ts
export function imageAlt(
  img: DevImage,
  developmentTitle: string,
  categoryCount: number,
): string
```

Retorna `"{Categoria} — {título}"`, acrescentando `" (foto N)"` a todas as imagens quando a categoria tem 2+ fotos. Fallback de rótulo: `categoryLabel` do próprio módulo → "Galeria".

## 3. `src/routes/empreendimentos.$slug.tsx`

### 3.1 Loader
- `loader: async ({ params })` executa a query hoje no `useQuery` da linha ~133: `supabase.from("developments").select("*, regions(name)").eq("slug", params.slug).eq("active", true).maybeSingle()`; lança `notFound()` se erro ou sem resultado.
- Componente principal troca esse `useQuery` por `Route.useLoaderData()` (sem estados de loading/error para essa query).
- **Manter intacto** o segundo `useQuery` (linha ~832, imóveis vinculados) — continua client-side.
- `pendingComponent`: extrair o skeleton atual para um componente nomeado; `pendingMs: 300`, `pendingMinMs: 400`.
- `notFoundComponent`: "Empreendimento não encontrado" + `Link` para `/empreendimentos` (mesmo molde da rota de imóveis).
- `errorComponent`: mensagem genérica + botão tentar novamente (mesmo molde de imóveis).

### 3.2 `head()` com dados reais
- Assinatura `head: ({ loaderData, params })`; fallback genérico (título "Empreendimento | Bruno Barreto", descrição institucional) quando `loaderData` for indefinido.
- Remover `titleFromSlug` (fica sem uso).
- **Título**: `buildSeoTitle({ title: dev.title, region: dev.regions?.name })`.
- **Descrição** (≤155 chars, só fragmentos não nulos, sem buracos):
  `{Título}: {tipologias}, de {area_from} a {area_to} m², a partir de R$ {price_from}. {Pronta entrega | Entrega prevista para {MM/AAAA}}. Bruno Barreto, CRECI-DF 34.060.`
  (tipologias do array; área só quando ambos os extremos existem — ou o único existente; preço formatado pt-BR; status derivado de `delivery_status`/data de entrega conforme colunas reais — verificar nomes exatos das colunas durante a implementação.)
- **og:image**: `pickCoverImage(dev.images)?.url` com fallback para a imagem padrão do site (mesma usada na home, se houver — verificar; se não houver padrão definido, omitir quando não houver capa); adicionar `og:image:width` 1200, `og:image:height` 630, `og:image:alt` = título, e `twitter:image` + `twitter:card: summary_large_image` quando houver imagem.
- Manter `og:url` e canonical absolutos como hoje.
- **JSON-LD inalterado.**

### 3.3 Alts descritivos
- Substituir os dois `alt=""` (linhas ~551 hero e ~646 galeria/lightbox) por `imageAlt(img, dev.title, categoryCount)`.
- Nenhum `alt=""` restante no arquivo.

## Não muda
Layout, design, formulário de contato, lightbox, carrossel, `imoveis.$slug.tsx`, JSON-LD, demais rotas.

## Verificação
- `bun run build:dev` passa.
- SSR: HTML de um empreendimento real contém título, preço e descrição; meta og/twitter corretas.
- Slug inexistente → HTTP 404 com o `notFoundComponent`.
- Empreendimento sem preço/capa/data de entrega renderiza sem erro.
- `rg 'alt=""' src/routes/empreendimentos.$slug.tsx` sem resultados.
