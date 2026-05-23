## Conectar Home e /empreendimentos ao Supabase

Escopo: apenas `src/components/home/FeaturedDevelopments.tsx` e `src/routes/empreendimentos.tsx`. Nada mais é alterado (layout, design tokens, carrossel, header/footer permanecem idênticos).

### 1. `FeaturedDevelopments.tsx` — Home

- Remover array `MOCK` e imports de placeholder.
- Adicionar `useQuery` (já há `@tanstack/react-query` no projeto) com:
  - `queryKey: ['home', 'featured-developments']`
  - `queryFn:` `supabase.from('developments').select('*, regions(name)').eq('active', true).eq('featured', true).order('featured_order')`
- Mapear linhas do Supabase para o shape esperado pelo `<Slide>`:
  - `name ← title`
  - `region ← regions?.name ?? ''`
  - `cover_image_url ← images?.[0]`
  - `status`: manter mapeamento conforme valor no DB (`pronta_entrega` → `ready`, `previsao` → `forecast`); usar `delivery_date` para `delivery_forecast` (formatado `MM/AAAA`).
  - `price_from ← price_from` (number)
  - `typology`, `builder`, `slug`: vindos do row
- Estados:
  - `isLoading` → renderizar `<SlideSkeleton />` (já existe).
  - `items.length === 0` → renderizar mensagem "Nenhum empreendimento disponível no momento." dentro do container (mesma moldura, sem quebrar layout).
  - Caso contrário, manter exatamente o carrossel atual (índice, setas, dots).

### 2. `src/routes/empreendimentos.tsx` — Listagem

Atualmente é só um título placeholder. Adicionar:

- `useQuery`:
  - `queryKey: ['developments', 'all-active']`
  - `queryFn:` `supabase.from('developments').select('*, regions(name)').eq('active', true).order('created_at', { ascending: false })`
- Render:
  - Mantém `<Layout>` e o título existente "Empreendimentos".
  - Grid responsivo de cards (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) usando tokens do design system (bg-background, border-border, font-heading, font-body, text-primary, bg-badge-green/blue).
  - Cada card mostra:
    - Imagem `images[0]` (com fallback `bg-surface` se vazia)
    - Badge de status no canto da imagem: verde "PRONTA ENTREGA" ou azul "PREVISÃO MM/AAAA" (a partir de `delivery_date`)
    - Título (`font-heading`)
    - Região (`regions?.name`) com ícone `MapPin`
    - Tipologia
    - Preço "A partir de R$ ..." em `text-primary`
  - Loading: skeletons (6 cards `animate-pulse`).
  - Vazio: mensagem "Nenhum empreendimento disponível no momento." centralizada.

### Fora de escopo

- Página de detalhe `/empreendimentos/:slug`.
- Link clicável dos cards de listagem (pode ser adicionado depois — manter por ora ou só como `<a>` para `/empreendimentos/${slug}` sem alterar rotas).
- Mudanças em `Header`, `Footer`, outros componentes da home, tokens CSS, ou tabela `developments`.
