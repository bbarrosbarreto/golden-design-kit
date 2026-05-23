## Plano — Componentes Globais (Header, Footer, WhatsAppButton, Layout)

Criar 4 componentes em `src/components/layout/` e aplicá-los às rotas públicas. Apenas tokens do design system (cor `#25D366` é exceção justificada — cor oficial do WhatsApp).

### 1. `src/components/layout/Header.tsx`
- Fixo no topo (`fixed top-0 inset-x-0 z-50`).
- Logo "BB" à esquerda: `font-heading text-3xl text-foreground`, link para `/`.
- Menu central (desktop ≥ md): Links TanStack para `/empreendimentos`, `/imoveis`, `/sobre`, `/contato` — `font-body text-sm` com `activeProps` em `text-primary`.
- Botão WhatsApp à direita (desktop): `<Button variant="primary" asChild>` envolvendo `<a href="https://wa.me/5561999350888" target="_blank" rel="noopener">`.
- Scroll behavior: `useState` + `useEffect` listener em `window.scroll`; quando `scrollY > 10` → `bg-background shadow-md`, senão `bg-transparent`. Transição via `transition-all duration-300`.
- Mobile (< md): esconder menu/botão, mostrar ícone `Menu` (lucide) que abre `Sheet` do shadcn (`src/components/ui/sheet.tsx`) como drawer lateral contendo os mesmos links + botão WhatsApp.

### 2. `src/components/layout/Footer.tsx`
- `bg-foreground text-background` com padding generoso.
- Logo "BB" centralizada (`font-heading text-4xl`).
- Linha de nav central: mesmos 4 links, separados por `|`, com hover `text-primary`.
- Linha de ícones sociais centralizada: `Instagram` e `MessageCircle` (lucide) como `<a>` para Instagram e WhatsApp, alvo `_blank`.
- "CRECI-DF 34060" em `text-muted-foreground text-sm` centralizado.
- Copyright: `© 2025 Bruno Barreto Imóveis. Todos os direitos reservados.` em `text-background/70 text-xs`.

### 3. `src/components/layout/WhatsAppButton.tsx`
- `fixed bottom-6 right-6 z-50`.
- Círculo `h-14 w-14 rounded-full` com `style={{ backgroundColor: '#25D366' }}` (cor de marca WhatsApp — exceção justificada), ícone `MessageCircle` branco.
- Link para `https://wa.me/5561999350888`, `target="_blank"`.
- Tooltip "Fale comigo no WhatsApp" via componente `Tooltip` do shadcn.
- Animação de entrada: classe `animate-in zoom-in` (tw-animate-css já importado) ou keyframe simples scale 0→1.

### 4. `src/components/layout/Layout.tsx`
- Wrapper: `<>{<Header />}<main className="pt-20 min-h-screen">{children}</main><WhatsAppButton /><Footer /></>`.
- `pt-20` compensa altura do header fixo (~80px).

### 5. Aplicar Layout às rotas públicas
- Hoje só existe `src/routes/index.tsx`. Envolver seu componente com `<Layout>…</Layout>`.
- Não criar `/empreendimentos`, `/imoveis`, `/sobre`, `/contato` agora (escopo: apenas globais). Os links do menu apontarão para essas rotas que serão criadas em etapas futuras — TanStack Router fará typecheck quando elas existirem. Para evitar erro de build agora, usar `<a href="/empreendimentos">` etc. nos links até as rotas existirem **OU** criar route stubs vazios. Recomendação: **criar 4 route files mínimos** (`empreendimentos.tsx`, `imoveis.tsx`, `sobre.tsx`, `contato.tsx`) cada um exportando `createFileRoute` com um `<Layout>` e um `<h1>` placeholder, para permitir `<Link to="/...">` type-safe e satisfazer "header/footer aparecem em todas elas".

### Notas técnicas
- Importações de `Link`/`useNavigate` de `@tanstack/react-router`.
- Logo é texto "BB" em Playfair (a imagem enviada serve apenas como referência de identidade visual: azul-marinho profundo + dourado — já alinhado com `--foreground` + `--primary`).
- Tooltip exige `<TooltipProvider>` — adicionar no `Layout` ou no próprio botão.
