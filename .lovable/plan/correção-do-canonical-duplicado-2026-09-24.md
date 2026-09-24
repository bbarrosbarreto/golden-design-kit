# Correção do canonical duplicado

Cada página pública deve ter exatamente UMA tag canonical, com a URL da própria página. Hoje a raiz e os layouts intermediários injetam canonical em todas as páginas, gerando 2 a 3 tags por página.

## Alterações

### 1. `src/routes/__root.tsx`
Remover a linha do canonical genérico (`{ rel: "canonical", href: "https://brunobarretoimoveis.com.br" }`, linha 91) do array `links`. A home já tem canonical própria em `index.tsx` com barra final — essa é a versão que fica.

### 2. `src/routes/imoveis.tsx` e `src/routes/empreendimentos.tsx`
Remover APENAS a entrada de canonical do array `links` do `head()` de cada layout intermediário. Verificação prévia confirmou: em ambos os arquivos o `head()` contém somente o canonical (nenhum title, meta, Open Graph ou JSON-LD). Como o `head()` ficará vazio após a remoção, ele será removido por completo, restando apenas o `component` com `<Outlet />`. Se qualquer outra entrada fosse encontrada, o `head()` seria mantido com o restante intacto. Isso elimina a canonical da listagem que hoje contamina as páginas de detalhe ($slug).

### 3. Manter como estão as 7 rotas folha
Nenhuma alteração em: `index.tsx`, `sobre.tsx`, `contato.tsx`, `imoveis.index.tsx`, `imoveis.$slug.tsx`, `empreendimentos.index.tsx`, `empreendimentos.$slug.tsx`. Elas já emitem a canonical correta da própria URL.

## Resultado esperado por página

- `/` → `https://brunobarretoimoveis.com.br/` (1 tag)
- `/sobre` → `https://brunobarretoimoveis.com.br/sobre` (1 tag)
- `/contato` → `https://brunobarretoimoveis.com.br/contato` (1 tag)
- `/imoveis` → `https://brunobarretoimoveis.com.br/imoveis` (1 tag)
- `/empreendimentos` → `https://brunobarretoimoveis.com.br/empreendimentos` (1 tag)
- `/imoveis/<slug>` → canonical do próprio imóvel (1 tag)
- `/empreendimentos/<slug>` → canonical do próprio empreendimento (1 tag)
- `/admin/*` → nenhuma canonical (não devem ser indexadas; já têm noindex)

## Verificação

1. `bunx tsgo --noEmit` e `bun run build` devem passar.
2. Confirmar no HTML gerado (não apenas no código), inspecionando o `<head>` servido de `/`, `/sobre`, `/imoveis` e de uma página de detalhe real (ex.: `/imoveis/3-quartos-moment-noroeste`): exatamente uma tag `<link rel="canonical">` por página, com a URL da própria página.

## Fora de escopo (não tocar)

- `src/lib/feed-*.ts` e `src/routes/feeds.*` (XMLs dos portais, já validados)
- `src/routes/sitemap[.]xml.ts`
- Todas as demais tags de head: title, meta description, Open Graph, Twitter e JSON-LD permanecem exatamente como estão
