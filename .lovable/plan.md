# Etapa 2 — Feed XML padrão ZAP em /feeds/zap.xml

## 1. Extração das constantes públicas

Novo arquivo `src/lib/supabase-public.ts` exportando `SUPABASE_URL` e `SUPABASE_ANON_KEY` (mesmos valores hoje duplicados em `sitemap[.]xml.ts`).
`src/routes/sitemap[.]xml.ts` passa a importar de lá; nenhuma outra linha do sitemap muda.

## 2. Mapeamento de tipo em `src/lib/property-export.ts`

Nova função `zapPropertyType(type, category)` → `{ tipo, subtipo, categoria }`:

| type | TipoImovel | SubTipoImovel |
| --- | --- | --- |
| apartamento | Apartamento | Apartamento Padrão |
| cobertura | Apartamento | Apartamento Padrão |
| casa | Casa | Casa Padrão |
| casa_condominio | Casa | Casa de Condomínio |
| terreno | Terreno | Terreno Padrão |
| comercial | Comercial/Industrial | Conjunto Comercial/Sala |
| rural | Rural | Chácara |

`categoria` traduz a coluna `category` (padrao → Padrão, terrea → Térrea, sobrado_duplex → Sobrado/Duplex, sobrado_triplex → Sobrado/Triplex, cobertura → Cobertura, cobertura_duplex → Cobertura Duplex, cobertura_triplex → Cobertura Triplex). Para `terreno`, `comercial` e `rural`, a categoria é sempre "Padrão". Tipo desconhecido cai em Apartamento / Apartamento Padrão.

## 3. Rota `src/routes/feeds.zap[.]xml.ts`

Mesmo molde do sitemap: `createFileRoute("/feeds/zap.xml")` com `server.handlers.GET`, busca via REST do Supabase com a chave pública (paginada em 1000), montagem do XML como string e retorno em `Response`.

Cabeçalhos: `Content-Type: application/xml; charset=utf-8` e `Cache-Control: public, max-age=900`.

Filtro na query: `active=eq.true`, `status=eq.disponivel`, `export_enabled=eq.true`, `export_portals=cs.{dfimoveis}`.

Filtro em memória, reaproveitando `evaluateReadiness`/`isReady` de `property-export.ts` (CEP de 8 dígitos, bairro, descrição 50–3000, título 10–100, mínimo 5 imagens, preço > 0, ao menos um portal), com duas checagens extras próprias do feed: presença de `dfimoveis` em `export_portals` e ao menos uma área preenchida (`area`, `useful_area` ou `built_area`).

Imagens normalizadas com `normalizePropImages` + `resolveCategoryOrder`, na mesma ordem exibida no site; a capa fica em primeiro lugar e recebe `<Principal>1</Principal>`.

## 4. Estrutura do XML

```text
<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsd="..." xmlns:xsi="...">
  <Imoveis>
    <Imovel>...</Imovel>
  </Imoveis>
</Carga>
```

Campos por `<Imovel>` na ordem pedida: CodigoImovel, TituloImovel, TipoImovel, SubTipoImovel, CategoriaImovel, Estado, Cidade, Bairro (CDATA), Endereco, Numero, Complemento (omitido se vazio), CEP (8 dígitos), Latitude/Longitude (omitidos se nulos), PrecoVenda, PrecoAluguel, PrecoCondominio, IPTU, QtdDormitorios, QtdSuites, QtdBanheiros, QtdSalas, QtdVagas, AreaTotal, AreaUtil (`useful_area` ou `built_area`), AnoConstrucao, Observacao (CDATA), TipoOferta = 1, Fotos, Videos.

Preço: `purpose = 'venda'` → PrecoVenda = `price` e, se `rent_price > 0`, também PrecoAluguel; `purpose = 'aluguel'` → apenas PrecoAluguel = `price`.

Valores monetários e de área saem como inteiros arredondados para baixo, sem símbolo nem separador. Tags numéricas nulas são omitidas conforme a lista acima.

`Videos` só aparece quando `video_url` é do YouTube; a URL vai em CDATA.

## 5. Escape

Helper de escape para `&`, `<`, `>`, `"` e `'` em todo texto fora de CDATA; helper de CDATA que neutraliza qualquer ocorrência de `]]>`.

## 6. Feed vazio e erros

Falha de rede ou zero elegíveis devolvem 200 com `<Imoveis></Imoveis>` — nunca erro nem HTML.

## 7. Verificação

Build e requisição local a `/feeds/zap.xml` conferindo status 200, XML bem formado e feed hoje vazio; confirmação de que `/sitemap.xml` segue idêntico.

## 8. Não mexer

Nenhuma página pública, nenhum ajuste no PropertyForm, nenhum SQL gerado ou executado.
