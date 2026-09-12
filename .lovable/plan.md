# Etapa 2 — Feeds XML padrão ZAP (DF Imóveis e Wimóveis)

## 1. Terceiro portal no seletor

Em `src/lib/property-export.ts`, `EXPORT_PORTALS` passa a ter três entradas:

- `{ value: "dfimoveis", label: "DF Imóveis" }`
- `{ value: "wimoveis", label: "Wimóveis" }`
- `{ value: "grupozap", label: "ZAP / VivaReal / OLX" }`

O checkbox novo aparece automaticamente no PropertyForm; nenhuma outra alteração no formulário.

## 2. Extração das constantes públicas

Novo arquivo `src/lib/supabase-public.ts` exportando `SUPABASE_URL` e `SUPABASE_ANON_KEY` (mesmos valores hoje duplicados em `sitemap[.]xml.ts`). O sitemap e as rotas de feed importam de lá; comportamento do sitemap inalterado.

## 3. Gerador compartilhado `src/lib/feed-zap.ts`

Função única que recebe o código do portal (`"dfimoveis"` ou `"wimoveis"`) e devolve a string XML completa. É ela que:

1. Busca as propriedades via REST do Supabase (paginada em 1000) com filtros `active=eq.true`, `status=eq.disponivel`, `export_enabled=eq.true` e `export_portals` contendo o portal recebido.
2. Filtra em memória reaproveitando `evaluateReadiness`/`isReady` (CEP de 8 dígitos, bairro, descrição 50–3000, título 10–100, mínimo 5 imagens, preço > 0, ao menos um portal), acrescentando a checagem de ao menos uma área preenchida (`area`, `useful_area` ou `built_area`).
3. Normaliza imagens com `normalizePropImages` + `resolveCategoryOrder`, na ordem exibida no site; a capa vem primeiro e recebe `<Principal>1</Principal>`.
4. Monta o XML com escapes corretos.

## 4. Mapeamento de tipo em `src/lib/property-export.ts`

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

## 5. Rota de feed (casca fina)

- `src/routes/feeds.zap[.]xml.ts` → `/feeds/zap.xml`, chama o gerador com `"dfimoveis"`

Mesmo molde do sitemap: `createFileRoute` com `server.handlers.GET`, `Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=900`. O feed do Wimóveis (formato OpenNavent) NÃO entra nesta etapa: será etapa própria, com gerador `feed-opennavent.ts` e rota separada. O checkbox "Wimóveis" permanece em `EXPORT_PORTALS` apenas como dado.

## 6. Estrutura do XML

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

Valores monetários e de área saem inteiros arredondados para baixo, sem símbolo nem separador. Tags numéricas nulas são omitidas conforme a lista acima. `Videos` só aparece quando `video_url` é do YouTube, com a URL em CDATA.

## 7. Escape e feed vazio

Helper de escape para `&`, `<`, `>`, `"` e `'` fora de CDATA; helper de CDATA que neutraliza `]]>`. Falha de rede ou zero elegíveis devolvem 200 com `<Imoveis></Imoveis>` — nunca erro nem HTML.

## 8. Verificação

Build e requisições locais a `/feeds/zap.xml` e `/feeds/wimoveis.xml` conferindo status 200 e XML bem formado (hoje vazios, pois nenhum imóvel tem CEP/bairro); confirmação de que `/sitemap.xml` segue idêntico.

## 9. Não mexer

Nenhuma página pública além do novo checkbox automático, nenhum ajuste extra no PropertyForm, nenhum SQL gerado ou executado.
