## Refazer Pillars: linha única no desktop, carrossel no mobile

Reescrever apenas `src/components/home/Pillars.tsx` mantendo os 6 pilares e o header da seção.

### Desktop (md+)
- Os 6 cards em **uma única linha horizontal** usando `hidden md:grid grid-cols-6 gap-3`
- Cards compactos: padding reduzido (`p-4`), apenas **ícone + título**, sem descrição
- Ícone pequeno (`size={22}`) em `text-primary`
- Título em `font-heading text-sm` (centralizado, 2 linhas máx com `leading-tight`)
- Borda `border-border`, hover → `hover:border-primary hover:shadow-gold`
- `overflow-hidden` no container para evitar quebra

### Mobile (<md)
- Carrossel horizontal com **1 card por vez** (`md:hidden`)
- Estado `useState` para índice + funções prev/next (mesmo padrão de `FeaturedProperties`)
- Setas `ChevronLeft`/`ChevronRight` (lucide) sobrepostas com `backdrop-blur`
- Dots indicadores abaixo (6 dots, ativo em `w-8 bg-primary`)
- Transição `transform 300ms`
- No mobile o card pode manter a descrição (mais espaço vertical disponível)

### Mantido
- Array `pillars` inalterado (ícones, títulos, descrições)
- `bg-surface` na seção, `py-16`
- Header "Por que Bruno Barreto" + subtítulo
- Ícones lucide em `text-primary`, hover `shadow-gold` + borda `primary`

### Não alterar
- Nenhum outro arquivo. Ordem da Home permanece igual.
