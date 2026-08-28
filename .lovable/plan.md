# Correções pontuais de SEO

Tarefas pequenas e independentes no site Bruno Barreto Imóveis, sem alterar layout ou comportamento.

## Tarefa 1 — `src/routes/__root.tsx`

- Trocar `<html lang="en">` por `<html lang="pt-BR">`.
- Substituir a meta `author: "Lovable"` por `{ name: "author", content: "Bruno Barreto Imóveis" }`.
- Trocar `twitter:site` de `"@Lovable"` para `"@brunobarreto.corretor"`.
- Trocar `twitter:card` de `"summary"` para `"summary_large_image"`.
- Adicionar as metas que faltam:
  - `og:site_name` = "Bruno Barreto Imóveis"
  - `og:locale` = "pt_BR"
  - `og:url` = "https://brunobarretoimoveis.com.br"
- Adicionar link canonical da home: `{ rel: "canonical", href: "https://brunobarretoimoveis.com.br" }`.

## Tarefa 2 — Canonical nas demais rotas

Adicionar `links: [{ rel: "canonical", href: <url absoluta da rota> }]` no `head()` das rotas abaixo, se ainda não estiverem presentes:

- `/imoveis` → `https://brunobarretoimoveis.com.br/imoveis`
- `/empreendimentos` → `https://brunobarretoimoveis.com.br/empreendimentos`
- `/sobre` → `https://brunobarretoimoveis.com.br/sobre`
- `/contato` → `https://brunobarretoimoveis.com.br/contato`

As URLs devem ser limpas, sem querystring de filtros.

## Tarefa 3 — `lastmod` no sitemap

Em `src/routes/sitemap[.]xml.ts`:

- Na função `fetchSlugs`, trocar `select=slug` por `select=slug,updated_at`.
- Atualizar a interface de retorno para `{ slug: string | null; updated_at: string | null }[]`.
- Fazer com que `fetchSlugs` devolva `{ slug, updated_at }` em vez de apenas `slug`.
- No corpo do `GET`, mapear `updated_at` para formato ISO só a data (ex: `2026-08-28`) e emitir `<lastmod>` dentro de cada `<url>` de imóvel e empreendimento.
- As páginas fixas (`/`, `/imoveis`, `/empreendimentos`, `/sobre`, `/contato`) continuam sem `lastmod`.

## Detalhes técnicos

- Metadados e canonical via `head()` do TanStack Router.
- Sitemap é uma rota serverless em `src/routes/sitemap[.]xml.ts` que lê do Supabase via fetch anônimo.
- Nenhuma alteração em componentes, design ou lógica de negócio.

## Critérios de aceitação

- [ ] `lang="pt-BR"` no HTML servido
- [ ] Nenhuma menção a "Lovable" nas meta tags
- [ ] Canonical presente em todas as rotas públicas listadas
- [ ] `/sitemap.xml` abre com `<lastmod>` nos imóveis e empreendimentos
