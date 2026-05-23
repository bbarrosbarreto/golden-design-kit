## Plano: Criar seção "Anúncios em Destaque" na Home

### Objetivo
Criar o componente `FeaturedProperties` com dados mockados e inseri-lo na página inicial, abaixo da seção "Por que Bruno Barreto" (Pillars).

### Tarefas

#### 1. Criar `src/components/home/FeaturedProperties.tsx`
- **Dados:** 4 imóveis hardcoded (sem Supabase) com os campos:
  - id, slug, title, region, purpose (Venda/Aluguel), price, bedrooms, parking, area_sqm, status (Disponível/Reservado)
- **Layout da seção:**
  - Fundo `bg-background`
  - Cabeçalho: título "Anúncios em Destaque" (`font-heading`) + subtítulo em `text-muted-foreground`
  - Botão "Ver Todos" (`variant="outline-gold"`) alinhado à direita, link `/imoveis`
  - Grid responsivo: `grid-cols-1 md:grid-cols-2`
- **Card individual:**
  - Imagem placeholder `bg-muted aspect-video`
  - Badge finalidade: "VENDA" ou "ALUGUEL" em `bg-primary`
  - Badge status: "RESERVADO" em `bg-secondary` quando aplicável
  - Tipo e região em `text-muted-foreground text-sm`
  - Título em `font-heading`
  - Preço em `text-primary font-medium text-lg`
  - Linha de ícones: `BedDouble` (quartos), `Car` (vagas), `Maximize` (área) — todos em `text-muted-foreground`
  - Botão "Ver Imóvel" (`variant="outline-gold"`) link `/imoveis/:id`
  - Hover: `shadow-gold` + transição suave

#### 2. Editar `src/routes/index.tsx`
- Importar `FeaturedProperties` de `@/components/home/FeaturedProperties`
- Renderizar `<FeaturedProperties />` após `<Pillars />` (abaixo dos Pilares na Home)

### Resultado esperado
Seção "Anúncios em Destaque" renderizando 4 cards de imóveis em grid 2 colunas, pronta para integração com Supabase futura.