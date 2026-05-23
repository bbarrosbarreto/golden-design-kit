
# Configuração do Design System — Bruno Barreto Imóveis

Aplicar os tokens e tipografia da seção 3 do PRD globalmente, sem criar páginas ou componentes de negócio.

## Nota sobre a stack

O template usa **TanStack Start + Tailwind v4**, onde os tokens vivem em `src/styles.css` via `@theme inline` (não existe `tailwind.config.ts` e o arquivo de estilo global se chama `styles.css`, não `index.css`). Vou aplicar o espírito do PRD nesse formato — todos os tokens HSL ficam disponíveis como classes Tailwind semânticas (`bg-primary`, `text-foreground`, `font-heading`, `shadow-gold`, etc.), exatamente como o critério de aceitação exige.

## Mudanças

### 1. `src/styles.css` — reescrever o bloco de tema

- Adicionar `@import` do Google Fonts (Playfair Display 400/600 + Inter 300/400/500) no topo, antes do `@import "tailwindcss"`.
- Substituir os tokens oklch atuais pelos tokens HSL do PRD (seção 3.1):
  - `--background`, `--foreground`, `--surface`, `--primary` (+ foreground), `--secondary` (+ foreground), `--muted` (+ foreground), `--border`, `--input`, `--card` (+ foreground), `--accent` (+ foreground)
  - `--badge-green`, `--badge-blue`
  - `--radius: 0.375rem`
  - Sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-gold`
  - `--transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`
  - Fontes: `--font-heading`, `--font-body`
- Atualizar `@theme inline` para mapear todos os tokens como utilitários Tailwind v4:
  - `--color-background: hsl(var(--background))`, etc. (envelopar com `hsl()` já que os tokens são HSL crus)
  - `--color-surface`, `--color-badge-green`, `--color-badge-blue`
  - `--font-heading: var(--font-heading)`, `--font-body: var(--font-body)`
  - `--shadow-sm/md/lg/gold` mapeados a partir das variáveis
  - `--radius-*` derivados de `--radius`
- Remover o bloco `.dark` (PRD não pede dark mode nesta fase) e remover tokens não usados (`chart-*`, `sidebar-*`, `popover`, `destructive`, `ring`) para manter o sistema enxuto e fiel ao PRD.
- Atualizar `@layer base` para aplicar `font-family: var(--font-body)` no body e `var(--font-heading)` em h1–h3.

### 2. `src/components/ui/button.tsx` — adicionar variantes do PRD

Editar o `buttonVariants` (cva) existente, adicionando/ajustando:
- `primary` — `bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold`
- `outline-gold` — `border border-primary text-primary bg-transparent hover:bg-primary/10`
- `ghost` — ajustar a variante existente para `hover:bg-surface text-foreground`

Manter as outras variantes do shadcn intactas para compatibilidade com componentes ui já presentes.

## O que NÃO será feito (escopo desta etapa)

- Nenhuma rota nova, nenhuma página, nenhum Header/Footer/Hero
- Nenhum botão flutuante de WhatsApp
- Nenhuma tabela Supabase (Cloud não será ativada agora)
- `src/routes/index.tsx` permanece com o placeholder

## Critério de aceitação verificado

Após aplicar, ficarão disponíveis globalmente:
- Cores: `bg-background`, `bg-surface`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-badge-green`, `bg-badge-blue`, etc.
- Tipografia: `font-heading` (Playfair) e `font-body` (Inter)
- Sombras: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-gold`
- Raio: `rounded-md` usando `--radius: 0.375rem`
- Variantes Button: `<Button variant="primary">`, `<Button variant="outline-gold">`, `<Button variant="ghost">`
