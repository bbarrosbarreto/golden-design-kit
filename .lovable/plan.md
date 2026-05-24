## Objetivo

Suportar categorias por foto no cadastro de empreendimentos. Estrutura nova: `{ url: string; category: string }[]`. Compatível com dados legados em `string[]`.

## Categorias

`fachada` (Fachada), `area_comum` (Área Comum), `lazer` (Lazer), `planta` (Planta), `apartamento` (Apartamento), `outros` (Outros). Padrão: `outros`.

## Arquivos alterados

### 1. `src/components/admin/ImageUploader.tsx`
- Trocar tipo da prop: `value: { url: string; category: string }[]` e `onChange` correspondente.
- Constante `CATEGORIES` com `value`/`label`.
- Função `normalize(input)` aceita `string[]` ou nova forma e retorna sempre `{ url, category }[]` (legacy → `category: "outros"`).
- Upload: novas fotos entram com `category: "outros"`.
- Render: agrupar por categoria usando `Tabs` do shadcn (aba "Todas" + uma por categoria que tenha foto). Cada card mostra thumbnail, `<Select>` de categoria e botão X.
- Mudança de categoria/remoção atualiza via `onChange`.

### 2. `src/components/admin/DevelopmentForm.tsx`
- Tipo `DevelopmentRow.images`: `Array<{ url: string; category: string }> | string[] | null` (input tolerante).
- `FormValues.images`: `{ url: string; category: string }[]`.
- `empty.images`: `[]`.
- `toForm`: normalizar `d.images` (se item for string → `{ url, category: "outros" }`).
- `toPayload.images`: já é a estrutura nova (salva como JSON).
- Passar `images` e `onChange` atualizados ao `<ImageUploader />`.

### 3. Consumidores de leitura (não alterar layout, só leitura tolerante)
Verificar e adaptar somente os pontos que leem `dev.images[0]` como string:
- `src/routes/admin/empreendimentos.tsx` (thumbnail da tabela): aceitar item string ou `{ url }`.
- `src/routes/empreendimentos.index.tsx`, `src/routes/empreendimentos.$slug.tsx`, `src/components/home/FeaturedDevelopments.tsx`: normalizar leitura para extrair `url`.

Helper compartilhado em `src/lib/development-images.ts` com:
```ts
export type DevImage = { url: string; category: string };
export function normalizeImages(input: unknown): DevImage[];
export function imageUrls(input: unknown): string[];
```
Usado por todos os consumidores para evitar repetição.

## Fora de escopo

Migração retroativa de dados no banco (a conversão é feita em runtime via `normalizeImages`). Nenhum outro campo do formulário é alterado.
