# SSR na página de detalhe de imóvel (`/imoveis/$slug`)

Mover a busca do Supabase do `useQuery` (cliente) para o `loader` da rota, fazendo o HTML servido já conter título, preço e descrição, além de enriquecer as metas e os `alt` das fotos.

Escopo: apenas `src/routes/imoveis.$slug.tsx` e `src/lib/property-images.ts`. Não mexer em empreendimentos, JSON-LD, layout ou comportamento visual.

## Tarefa 1 — Loader da rota

1. Adicionar `loader` em `createFileRoute("/imoveis/$slug")` executando a mesma query atual do `useQuery`:
   `supabase.from("properties").select("*, regions(name), developments(id, title, slug)").eq("slug", params.slug).eq("active", true).maybeSingle()`
2. Se `error` ou `data === null`, lançar `notFound()`.
3. No `PropertyDetailPage`, trocar `useQuery` por `Route.useLoaderData()` e passar direto para `<PropertyDetail prop={...} />`.
4. Remover `isLoading`/`error` (skeleton de carregamento e o `throw redirect({ to: "/imoveis" })`), e o import de `useQuery`/`redirect` se não sobrar uso.
5. Adicionar `notFoundComponent` à rota: uma tela simples de "Imóvel não encontrado" com link para `/imoveis`, e um `errorComponent` com `router.invalidate()` no retry (sem mexer no visual das seções da página).
6. Feedback na navegação interna: reaproveitar o skeleton atual do estado `isLoading` como `pendingComponent` da rota, com `pendingMs: 300` (só aparece se o loader demorar mais que 300 ms) e `pendingMinMs: 400` (evita flash). Assim o SSR entrega a página pronta no acesso direto e a navegação a partir da listagem mantém resposta visual.
7. Manter `QueryClientProvider` e o resto do app intactos.

Observação técnica: o loader usa o client Supabase existente (leitura pública via RLS), que funciona tanto no SSR quanto no cliente — mesma abordagem dos loaders atuais do projeto.

## Tarefa 2 — `head()` com dados reais

1. Trocar `head: ({ params })` por `head: ({ loaderData })`.
2. **Fallback** (`loaderData` indefinido): título genérico "Imóvel | Bruno Barreto Imóveis" e descrição institucional curta, sem quebrar.
3. **Título** (máx. 60 chars, cortar com elegância):
   `{title} | {região} | Bruno Barreto Imóveis` — se a região faltar, omitir esse segmento; se passar de 60, truncar o título do imóvel com "…".
4. **Descrição** (máx. 155 chars): frase montada só com campos não nulos:
   `{Tipo} à venda/aluguel {na região}: X quartos, Y suítes, Z m², N vagas. {preço em R$ sem centavos ou "Valor sob consulta"}. Fale com Bruno Barreto, CRECI-DF 34.060.`
   Função helper local que junta os fragmentos com vírgulas, sem buracos.
5. **Open Graph / Twitter**:
   - `og:image` = `pickPropCover(images, type)?.url` (URL absoluta do Supabase); fallback para a imagem padrão do site (mesma URL usada nas demais rotas, se existir constante; senão omitir as tags de imagem).
   - `og:image:width` = 1200, `og:image:height` = 630, `og:image:alt` = título do imóvel.
   - `og:type` = "article", `og:url` e `link canonical` com `https://brunobarretoimoveis.com.br/imoveis/{slug}` (slug vem de `params`, que continua disponível em `head`).
   - Manter `twitter:title`/`twitter:description` e adicionar `twitter:image`.
6. JSON-LD atual permanece inalterado (Fase 3 futura).

## Tarefa 3 — `alt` descritivo nas fotos

1. Em `src/lib/property-images.ts`, criar:

```ts
const SINGULAR_LABELS: Record<string, string> = { /* quarto→Quarto, banheiro→Banheiro, etc. */ };

export function imageAlt(
  img: PropImage,
  propertyTitle: string,
  categoryCount: number, // total de fotos na categoria de `img`
  type?: PropertyType | string | null,
): string {
  const label =
    SINGULAR_LABELS[img.category] ??
    categoriesFor(type).find((c) => c.value === img.category)?.label ??
    "Foto";
  return categoryCount > 1
    ? `${label} — ${propertyTitle} (foto ${img.order})`
    : `${label} — ${propertyTitle}`;
}
```

Numeração consistente: quando a categoria tem 2+ fotos, TODAS recebem `"(foto N)"`, incluindo a primeira (ex.: "Quarto — Casa no Lago Sul (foto 1)", "(foto 2)"). Categoria com uma única foto não recebe número. O chamador passa `categoryCount` (ex.: `group.images.length` nos cards, `lightbox.list.length` no lightbox; capa/hero usa a contagem da própria categoria de capa).
```

2. Aplicar em todos os `<img>` da página:
   - Hero/capa: `imageAlt(cover, prop.title, prop.type)`
   - Cards do `CategorySection`: receber `propertyTitle`/`type` por props e usar `imageAlt(img, ...)`
   - Lightbox: `imageAlt(lightbox.list[lightbox.index], prop.title, prop.type)`
3. Garantir que não sobra nenhum `alt=""` no arquivo.

## Verificação

- `bun run build:dev` ok.
- `curl` no HTML SSR de um imóvel real: título, preço e descrição presentes no `<head>` e no body.
- Slug inexistente: página de notFound (404 lógico), sem crash.
- Imóvel sem preço e sem capa abre sem erro.
- Grep por `alt=""` em `imoveis.$slug.tsx` retorna zero.

## Fora de escopo

- `empreendimentos.$slug.tsx` (mesma mudança virá na próxima etapa).
- JSON-LD, layout, design system, lightbox/carrossel/ordenação — preservados.
