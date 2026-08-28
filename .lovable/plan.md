# Ordem e seções por categoria na página pública de imóveis

## Objetivo
Fazer a página `/imoveis/:slug` refletir a ordem definida no painel admin (`image_category_order`) e exibir cada categoria de fotos como uma seção independente, com rótulos no plural.

## Escopo
Apenas `src/lib/property-images.ts` e `src/routes/imoveis.$slug.tsx` serão alterados. Hero, lightbox, `CategorySection`, formulário, vídeo e a página de empreendimentos permanecem intactos.

## Tarefa 1 — Rótulos no plural em `src/lib/property-images.ts`

1. Adicionar o mapa `SECTION_LABELS` com os rótulos no plural para todas as categorias existentes (`Fachada`, `Salas`, `Cozinha`, `Quartos`, `Banheiros`, `Lazer e Áreas Comuns`, etc.).
2. Criar e exportar:
   ```ts
   export function sectionLabel(category: string, type?: PropertyType | string | null): string
   ```
   - Retorna `SECTION_LABELS[category]` quando existir.
   - Fallback para `categoryLabel(category, type)` quando não existir no mapa.

## Tarefa 2 — Página pública em `src/routes/imoveis.$slug.tsx`

1. Remover por completo a função `getSectionsFor`.
2. No type `PropertyDetail`, adicionar `image_category_order: unknown` (ou `string[] | null`).
3. Na query do Supabase, manter o `select` atual e garantir que `image_category_order` já está incluído (ele não precisa ser explicitamente listado com `*, ...`).
4. Substituir o bloco `{/* 3. GALERIAS POR CATEGORIA */}` por:
   - Obter grupos ordenados:
     ```ts
     const groups = groupImagesByCategory(allImages, prop.type, prop.image_category_order);
     ```
   - Importar `groupImagesByCategory` e `sectionLabel` de `@/lib/property-images`.
   - Iterar `groups.map((group, idx) => ...)`.
   - Para cada grupo renderizar `<CategorySection>` com:
     - `key={group.category}`
     - `title={sectionLabel(group.category, prop.type)}`
     - `images={group.images}`
     - `bg={idx % 2 === 0 ? BG : "#fff"}`
     - `onOpen={(i) => setLightbox({ list: group.images, index: i })}`
5. Garantir que `capa` nunca apareça como seção (já é função de `groupImagesByCategory`/`resolveCategoryOrder`).
6. Garantir que imóveis sem `image_category_order` usem a ordem padrão (já resolvido por `resolveCategoryOrder`).

## Critérios de aceitação
- [ ] Cada categoria com fotos vira uma seção com título próprio no plural.
- [ ] A ordem das seções obedece ao `image_category_order` salvo no banco.
- [ ] Dentro de cada seção as fotos seguem a numeração de `order` (1, 2, 3...).
- [ ] Categorias sem fotos não são renderizadas.
- [ ] A foto de capa não se repete como seção.
- [ ] Fundos alternados continuam funcionando.
- [ ] Nenhuma alteração em `CategorySection`, hero, lightbox ou página de empreendimentos.
