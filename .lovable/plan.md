# Diagnóstico: feed do Wimóveis sem BB1009–BB1011 (só relatório, nenhuma mudança)

## Achado principal
O `/feeds/wimoveis.xml` no ar hoje (21/10, 21:33 UTC) JÁ CONTÉM os quatro imóveis: BB1008, BB1009, BB1010 e BB1011 (11 anúncios no total). O `dataModificacao` voltou `1792618382638`, que é o horário exato da requisição. Ou seja, o feed é gerado na hora. A hipótese de prerender ou cache permanente não se confirma.

## 1. Prerender
- `vite.config.ts` linhas 11–15: só `tanstackStart: { server: { entry: "server" } }`. Não existe `prerender`, nem `pages`, nem `app.config`. Nenhuma busca por "prerender" no projeto encontra resultado.
- Sem `prerender.enabled: true`, nada é prerenderizado, nem por padrão. Isso vale também para a descoberta automática de rotas, que só acontece com o prerender ligado.
- As três rotas são handlers de servidor (`server.handlers.GET`): `feeds.wimoveis[.]xml.ts` linhas 4–9, `feeds.dfimoveis[.]xml.ts` linhas 4–8 e `feeds.zap[.]xml.ts` linhas 4–8. Elas rodam a cada requisição.

## 2. Headers
- Wimóveis: `feeds.wimoveis[.]xml.ts` linhas 11–14 (`application/xml; charset=utf-8`, `Cache-Control: public, max-age=900`). Em caso de erro, linha 19 devolve 500 sem Cache-Control.
- DF Imóveis: `feeds.dfimoveis[.]xml.ts` linhas 10–13, mesmos headers.
- ZAP: `feeds.zap[.]xml.ts` linhas 10–13, mesmos headers.
- Não há `CDN-Cache-Control` nem `s-maxage`.
- Na resposta real não aparece o header `cf-cache-status`, então o Cloudflare não serve essa rota do cache. O `max-age=900` permite que o próprio portal ou um proxy guarde o arquivo por até 15 minutos, não por 15 dias.
- Observação lateral: uma requisição HEAD devolve `text/html` (a página do site), porque só o GET está definido. Um GET normal devolve o XML.

## 3. Configuração do Cloudflare
- `wrangler.jsonc` linhas 1–7: só nome, `compatibility_date`, `nodejs_compat` e `main: src/server.ts`. Nenhuma regra de cache.
- Não existem `wrangler.toml`, `_headers` nem `_routes.json`. A pasta `public/` tem apenas `llms.txt` e `robots.txt`.
- `src/server.ts` linhas 69–79 só repassa a requisição e não faz cache.

## 4. Consulta ao Supabase
- `src/lib/feed-common.ts` linhas 53–78: `fetchEligible` faz `fetch` no Supabase na hora, filtrando `active=true`, `status=disponivel`, `export_enabled=true` e `export_portals cs.{portal}`, em páginas de 1000.
- Ela é chamada dentro do gerador, a cada GET: `feed-opennavent.ts` linha 465, `feed-dfimoveis.ts` linha 221 e `feed-zap.ts` linha 169. Nada é capturado no build.

## Conclusão
O código gera os feeds a cada requisição. Hoje o feed do Wimóveis lista os quatro imóveis novos. Causas plausíveis para o que você viu (não confirmadas):
- o imóvel ainda não passava em um dos filtros quando você conferiu: 13 itens de prontidão, ao menos uma área e `wimoveis` marcado;
- a versão publicada era anterior a alguma correção;
- cópia em cache do lado do portal ou do navegador.

Os feeds do DF Imóveis e do ZAP não trazem BB1008–BB1011, o que é coerente: esses imóveis só têm `wimoveis` marcado.
