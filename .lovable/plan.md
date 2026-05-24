## Contexto
Na página de detalhe de empreendimento (`src/routes/empreendimentos.$slug.tsx`), inserir uma nova seção de carrossel horizontal exibindo os imóveis do Supabase cujo `development_id` corresponde ao empreendimento atual. A seção deve ficar entre a seção de vídeo (quando existir) e o formulário de contato.

## Passos de implementação

1. **Adicionar imports necessários**
   - Importar `pickPropCover` de `@/lib/property-images`
   - Importar ícones `BedDouble`, `Car`, `Maximize`, `Home` do `lucide-react`
   - Importar `Link` do `@tanstack/react-router`

2. **Adicionar query de imóveis vinculados**
   - Dentro do componente `DevelopmentDetail`, adicionar `useQuery` com:
     - `queryKey`: `['linked-properties', dev.id]`
     - Buscar em `properties` onde `development_id = dev.id` e `active = true`
     - Ordenar por `created_at` descendente
     - `enabled: !!dev.id`

3. **Criar componente `LinkedPropertiesCarousel`**
   - Recebe `developmentId: string`
   - Executa a query acima
   - Se `isLoading`: renderiza 3 skeleton cards (retângulos cinza animados com `animate-pulse`)
   - Se `!data || data.length === 0`: retorna `null` (oculta completamente)
   - Caso contrário: renderiza seção com carrossel horizontal

4. **Layout da seção**
   - Fundo: `#fff` (branco) — alternância consistente com seções adjacentes (vídeo é `#1a1a1a`, formulário é `#1a1a1a`, então branco cria contraste)
   - Eyebrow em dourado: `"Disponíveis neste empreendimento"` (Inter, 11px, tracking, uppercase)
   - Título: `"Imóveis para você"` em Playfair Display, escuro
   - Linha dourada decorativa abaixo do título
   - Padding horizontal: `5%` (mesmo padrão da página)
   - Container: `max-w-6xl` centralizado

5. **Carrossel horizontal**
   - Scroll container com `overflow-x-auto`, `scrollSnapType: x mandatory`, `scrollbarWidth: none`
   - Botões prev/next absolutos (setas circulares brancas com sombra) — visíveis apenas no desktop
   - Cada card: largura fixa `320px`, `shrink-0`, `scrollSnapAlign: start`
   - Gap entre cards: `16px`

6. **Card de imóvel**
   - Imagem: `aspect-[16/10]` (160px de altura aproximada), `object-cover`, usando `pickPropCover(p.images, p.type)?.url`
   - Fallback sem imagem: fundo cinza claro com ícone `Home` cinza
   - Badge de finalidade: "VENDA" ou "LOCAÇÃO" — fundo `#C9A84C`, texto `#1a1a1a`, fonte 10px uppercase
   - Tipo + região: texto pequeno cinza (Inter 13px)
   - Título: Playfair Display 18px, `#1a1a1a`
   - Preço: Inter 16px font-weight 600, `#C9A84C`
   - Ícones de quartos, vagas, área (quando disponíveis): Inter 12px, cinza
   - Card clicável envolto em `<Link to="/imoveis/$slug">`
   - Border: `1px solid rgba(0,0,0,0.08)`, `border-radius: 2px`, `shadow-sm`
   - Hover: `translateY(-4px)` + `shadow-md` transição 300ms

7. **Responsivo**
   - Desktop: scroll horizontal com botões prev/next
   - Mobile: scroll horizontal nativo com touch, 1 card visível

8. **Inserir na página**
   - Inserir `<LinkedPropertiesCarousel developmentId={dev.id} />` dentro do `Layout`, após a seção de vídeo (linha 407) e antes da seção do formulário (linha 410)
   - Usar o hook `useInViewFade` já existente para animação fade-in na seção

## Arquivos a modificar
- `src/routes/empreendimentos.$slug.tsx` — único arquivo modificado

## Critérios de aceitação
- Seção aparece apenas quando há imóveis vinculados ativos
- Cards navegam corretamente para `/imoveis/[slug]`
- Imagens carregam via `pickPropCover`
- Skeleton exibido durante carregamento
- Seção oculta se query retornar vazio
- Sem regressões no formulário de contato ou lightbox