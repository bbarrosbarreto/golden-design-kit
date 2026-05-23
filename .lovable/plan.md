Criar componente `Partners.tsx` e inserir na Home antes do Footer.

### 1. Criar `src/components/home/Partners.tsx`
- Seção com fundo `bg-surface` e padding reduzido `py-8` (seção compacta, não principal)
- Título centralizado: "Nossos Parceiros" em `font-heading text-xl` (título de suporte, não principal)
- Subtítulo: "Construtoras e parceiros selecionados" em `text-muted-foreground text-sm`
- Desktop: `flex flex-row gap-6`, todos os 5 logos em **uma única linha sem quebra**
- Mobile: `overflow-x-auto` com scroll horizontal suave, logos permanecem em linha (não quebra em 2 linhas)
- 5 cards placeholder com `bg-muted rounded-lg h-20 w-40`, texto "Parceiro 1" a "Parceiro 5"
- Cada card: `grayscale` por padrão, `hover:grayscale-0`, transição `transition-all duration-300`
- Conteúdo centralizado com `flex items-center justify-center`
- Dados hardcoded — zero chamada ao Supabase

### 2. Inserir na Home (`src/routes/index.tsx`)
- Importar `Partners` do novo componente
- Adicionar `<Partners />` entre `<FeaturedProperties />` e `</Layout>` (antes do Footer)