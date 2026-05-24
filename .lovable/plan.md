## Redesign de `src/routes/empreendimentos.$slug.tsx`

Reescrita visual completa da página de detalhe do empreendimento, preservando 100% da lógica de dados (query Supabase, react-hook-form, insert em `leads`, redirect 404, roteamento).

### Estrutura nova (ordem)

1. **Hero 70vh full-bleed**
   - Imagem de fundo = `pickCoverImage(dev.images)` (capa → fachada → primeira).
   - Overlay `linear-gradient(to top, rgba(0,0,0,.7), transparent 60%)`.
   - Conteúdo no bottom (padding 40px 5%): badge status (borda 1px `#C9A84C`, texto branco 11px uppercase tracking 2px), título Playfair 48px branco, linha "região • Brasília/DF" Inter 14px branco 70%.

2. **Ficha resumo** (bg branco, 40px 5%)
   - Lista vertical de pares label/valor (label 12px uppercase muted, valor 16px semibold dark): Localização, Valor, Área, Tipologia, Entrega, Construtora. Itens sem valor são omitidos.
   - Botão CTA verde `#25D366`: "💬 Falar com o corretor" → `whatsappUrl` existente.

3. **Galeria por categoria** (seções verticais alternando bg `#FAFAF8` / `#FFFFFF`, 48px 5%)
   - Ordem: `fachada` → `area_comum` (rotulada "Lazer e Áreas Comuns", absorve qualquer item legado `lazer`) → `apartamento` → `planta` → `outros` (rótulo "Galeria"). Categoria `capa` não vira seção.
   - Cada seção: título Playfair 28px + linha dourada decorativa (40×2px, `#C9A84C`).
   - Carrossel horizontal com `scroll-snap-x`, cards 340×240 `object-cover` radius 2px, gap 12px, botões `<` `>` laterais que fazem `scrollBy`.
   - Click numa foto abre **lightbox**: overlay 95% preto, prev/next, fechar com X ou tecla ESC (listener com cleanup), trava scroll do body enquanto aberto.

4. **Sobre o empreendimento** (bg `#FAFAF8`, 60px 5%) — Playfair 30px + linha dourada + parágrafo Inter 17px `#555` line-height 1.85 max-w 720px. Renderiza só se `dev.description`.

5. **Diferenciais** — *não há campo `amenities` no schema atual.* Proposta: **omitir a seção** até existir o dado, em vez de inventar conteúdo. Confirmar na revisão se prefere placeholder estático ou derivar de outro campo.

6. **Vídeo** (bg `#1a1a1a`, 64px 5%) — só se `video_url` válido. Título Playfair 32px branco centralizado + iframe 16:9 max-w 860px.

7. **Formulário** (bg `#1a1a1a`, 64px 5%) — grid 2 colunas md+:
   - Coluna esquerda: headline Playfair 34px branco "Tenho interesse neste empreendimento" + subtítulo.
   - Coluna direita: inputs `bg rgba(255,255,255,.08)` borda `rgba(255,255,255,.2)` texto branco, focus borda `#C9A84C`. Campos: Nome*, WhatsApp, Mensagem. Botão "Quero ser Contactado" `#C9A84C`.
   - Mantém `useForm` + `supabase.from('leads').insert({...})` atual; renomeia o campo `phone` para `whatsapp` no UI label mas continua gravando em `phone` (coluna existente). Toast de sucesso "✓ Mensagem enviada! Em breve entraremos em contato."

8. **CTA WhatsApp fixo mobile** (`md:hidden`, `fixed bottom-0 inset-x-0 z-50`) — `#25D366`, padding 16px, texto branco bold "💬 Falar no WhatsApp", link `whatsappUrl`.

### Detalhes de implementação

- Tudo dentro do `<Layout>` existente.
- Hero usa cores hex literais conforme briefing (fora do design-system semântico, mas pedido explicitamente).
- Fade-in nas seções via `IntersectionObserver` num hook local `useInViewFade` aplicado às `<section>` (opacity 0 → 1, translateY 12px → 0, 600ms).
- Lightbox como subcomponente local controlado por estado `{ open, list, index }`.
- Carrossel como subcomponente local com `useRef` para `scrollBy({ left: ±360 })`.
- Sem novas dependências.
- Nenhuma mudança em `src/lib/development-images.ts`, query, rota, ou outros arquivos.

### Ponto a confirmar

Sobre a **Seção 5 (Diferenciais)**: não existe campo no banco. Opções:
- (A) Omitir a seção até existir o dado (recomendado).
- (B) Mostrar lista estática genérica.
- (C) Adicionar campo `amenities text[]` no schema (fora do escopo "só visual").

Sigo com (A) salvo orientação contrária.