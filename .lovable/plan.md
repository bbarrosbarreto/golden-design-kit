## Objetivo

Criar `/admin/empreendimentos` com CRUD completo conectado ao Supabase externo, mantendo o layout admin existente (sidebar + header) e o design system.

## Arquivos novos

```
src/components/admin/AdminLayout.tsx        // extrai sidebar + main do /admin/index.tsx
src/routes/admin/empreendimentos.tsx        // listagem + modal de form
src/components/admin/DevelopmentForm.tsx    // formulário dentro de Dialog
src/components/admin/ImageUploader.tsx      // upload múltiplo p/ Storage
src/lib/slug.ts                             // slugify util
```

## Arquivos editados

- `src/routes/admin/index.tsx` — passa a usar `<AdminLayout>` compartilhado e corrige link "Empreendimentos" para `/admin/empreendimentos`.

## Stack / padrões

- React Query (`@tanstack/react-query`) para fetch, cache e invalidação.
- Cliente: `supabase` (browser) de `@/integrations/supabase/client` — sem server functions, pois admin é client-side por trás do `AdminGuard` e a auth do usuário cobre RLS.
- Tokens do design system: `bg-primary`, `text-foreground`, `font-heading` (Playfair), `font-body` (Inter). Botões com variantes existentes (`primary`, `outline-gold`, `ghost`, `destructive`).
- Toasts via `sonner`.
- Validação com `zod` + `react-hook-form` (já presentes no shadcn/form).

## Listagem (`/admin/empreendimentos`)

- Header da página: título "Empreendimentos" + botão `Novo Empreendimento` (abre modal vazio).
- Input de busca por título (filtro client-side via `useMemo` sobre dados do React Query; suficiente para volumes típicos).
- `<Table>` com colunas: Imagem (primeira de `images[]`, thumb 56x56 rounded), Título, Região (join via `regions(name)`), Status (badge: `pronta_entrega` → `bg-badge-green`; `previsao` + `delivery_date` → `bg-badge-blue`), Destaque (estrela `bg-primary` se `featured`), Ações (Editar / Excluir).
- Excluir: `AlertDialog` de confirmação → `delete().eq('id', id)` → invalida query.
- Query key: `['admin','developments']`, `select('*, regions(id,name)')`.

## Formulário (Dialog)

Componente único `DevelopmentForm` aceita `initialData?` (edit) ou vazio (create). Campos:

- `title` (Input, obrigatório).
- `slug` (Input). Auto-preenchido do title em tempo real **até** o usuário tocar o campo (flag `slugDirty`). Util `slugify` (lowercase, remove acentos via `normalize('NFD')`, troca não-alfanum por `-`, colapsa hífens).
- `description` (Textarea).
- `region_id` (Select) — opções vindas de `supabase.from('regions').select('id,name').order('name')` cacheado em `['regions']`.
- `builder` (Input).
- `status` (Select: "Pronta entrega" / "Previsão").
- `delivery_date` (Input type="date") — renderizado condicionalmente quando `status === 'previsao'`.
- `typology` (input de tags simples: digitar + Enter adiciona chip; backspace remove último; armazenado como `string[]`).
- `price_from` (Input number).
- `area_from`, `area_to` (Inputs number, lado a lado).
- `images` (ImageUploader) — ver abaixo.
- `video_url` (Input).
- `virtual_tour_url` (Input).
- `featured` (Switch). Quando ligado, mostra `featured_order` (Input number).
- `active` (Switch, default true).

Submit:
- Create: `supabase.from('developments').insert({...}).select().single()`.
- Update: `.update({...}).eq('id', initialData.id)`.
- On success: `toast.success`, fecha dialog, `queryClient.invalidateQueries(['admin','developments'])`.
- On error: `toast.error(error.message)`.

## ImageUploader

- Input `<input type="file" multiple accept="image/*">`.
- Para cada arquivo: `supabase.storage.from('developments').upload(`${crypto.randomUUID()}-${file.name}`, file)`, então `getPublicUrl` → adiciona URL ao array `images`.
- Mostra grid de thumbs com botão "remover" (apenas tira do array; não deleta do storage para evitar quebrar versões anteriores).
- Pressupõe bucket `developments` público já criado. Se não existir, instrução pós-implementação para criar via SQL (não incluso no plano de código).

## AdminLayout compartilhado

`AdminLayout` recebe `children` e renderiza sidebar (com `NAV` atualizado: Dashboard, Empreendimentos, Imóveis, Leads) + `<main>`. Reaproveitado por `/admin` e `/admin/empreendimentos`. Item ativo destacado com `bg-surface text-primary` usando `useRouterState`.

## Fora de escopo

- Páginas `/admin/imoveis`, `/admin/leads`, `/admin/depoimentos`, etc.
- Criação do bucket `developments` (assumido existente).
- Edição de regiões (CRUD próprio).
- Paginação server-side (não necessária no volume atual).