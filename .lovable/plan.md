# Plano — FAQ nas páginas públicas de imóvel e empreendimento

## Objetivo

Exibir o FAQ gravado pelo admin (`properties.faq` / `developments.faq`) nas páginas públicas, com HTML semântico e visível (foco em crawlers de IA), mais um bloco JSON-LD `FAQPage` idêntico ao conteúdo renderizado.

## 1. Novo componente `src/components/FaqSection.tsx`

Props: `items: FaqItem[]` (de `src/lib/faq.ts`) e `title?: string` (padrão "Perguntas frequentes").

Filtros antes de renderizar (aplicados aqui, não nas rotas):
- Descarta itens com `q` ou `a` vazios (trim).
- Descarta itens cuja resposta contenha `"[PREENCHER"`.
- Se sobrar zero itens → retorna `null`.

Estrutura semântica:
- `<section aria-labelledby={id}>` com id estável para o heading.
- `<h2 id={id}>` com o título.
- Cada par: `<h3>` com a pergunta e `<p>` com a resposta logo abaixo.
- Nenhum accordion/details: texto sempre visível no HTML.

Visual, casando com o padrão das seções existentes das duas páginas (que usam inline styles com as constantes GOLD/DARK/BG):
- `<section>` com `padding: "60px 5%"`, fundo alternado recebido por prop `bg` (padrão `#fff`), como `CategorySection`.
- Container `mx-auto max-w-3xl`.
- `<h2>` via mesmo estilo de `SectionHeading` (Playfair, ~30px).
- `<h3>` em Playfair Display, ~19px, cor DARK, margem superior para separar pares.
- `<p>` em Inter, ~16px, cor `#555`, `lineHeight 1.8`, `maxWidth ~65ch`.
- Separador entre pares: `border-top` sutil `1px solid rgba(0,0,0,0.08)` (mesmo padrão do `divide-y` da ficha).

## 2. Integração nas duas rotas

Em `src/routes/imoveis.$slug.tsx`:
- Adicionar `faq: unknown` ao type `PropertyDetail` e ao `select` do loader.
- No componente: `const faqItems = normalizeFaq(prop.faq)`.
- Calcular o índice de zebrado a partir do final das galerias + seção "Sobre", passando o `bg` correto para manter a alternância.
- Renderizar `<FaqSection items={faqItems} title="Perguntas frequentes sobre este imóvel" bg={...} />` depois das galerias/descrição e antes do bloco de contato.

Em `src/routes/empreendimentos.$slug.tsx`:
- Idem, com `faq: unknown` no type do loader, `normalizeFaq(dev.faq)`.
- Título: `Perguntas frequentes sobre o {dev.title}`.
- Posição: após as galerias/Sobre (e antes do vídeo/contato), mantendo o zebrado.

Sem FAQ preenchido ou tudo filtrado → a seção não renderiza e a página fica exatamente como hoje.

## 3. JSON-LD FAQPage

Em cada rota, terceiro bloco `<script type="application/ld+json">` (imóvel) / segundo bloco (empreendimento, que hoje não tem JSON-LD — confirmação: empreendimentos não tem ld+json, então será o primeiro nessa página):

```json
{ "@context": "https://schema.org", "@type": "FAQPage",
  "mainEntity": [{ "@type": "Question", "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a } }] }
```

- Construído a partir dos MESMOS itens já filtrados pelo `FaqSection` (o filtro será extraído para uma função exportada `visibleFaqItems(items)` em `FaqSection.tsx` ou `src/lib/faq.ts`, usada pelos dois lados — divergência zero por construção).
- Zero itens → bloco não é emitido.
- Não altera meta tags nem os blocos JSON-LD existentes.

## Regras respeitadas

- Nenhuma mudança de layout nas seções existentes.
- Nenhuma alteração em meta tags nem no JSON-LD `RealEstateListing`/`BreadcrumbList`.
- Sem cores novas: reutiliza as constantes/padrões já usados nas páginas (Playfair/Inter, DARK, BG, borda rgba existente).

## Validação

- `bun run build:dev` passa.
- Inspeção do HTML SSR: respostas presentes no HTML sem interação; seção ausente quando não há FAQ; bloco FAQPage ausente sem itens e idêntico ao conteúdo visível quando presente.

## Detalhes técnicos

- `normalizeFaq` e o tipo `FaqItem` já existem em `src/lib/faq.ts`.
- Filtro compartilhado novo: `visibleFaqItems` em `src/lib/faq.ts` (q/a não vazias, sem "[PREENCHER").
- Arquivos alterados: `src/components/FaqSection.tsx` (novo), `src/lib/faq.ts`, `src/routes/imoveis.$slug.tsx`, `src/routes/empreendimentos.$slug.tsx`.
