# Etapa 2G — CodigoCliente no feed do DF Imóveis

Mudança isolada em `src/lib/feed-dfimoveis.ts`. Nenhum outro arquivo é tocado.

## Alterações

1. Nova constante no topo, junto de `CRECI`:

```ts
// Código de cliente fornecido pelo DF Imóveis para esta conta
const CODIGO_CLIENTE = "10974";
```

2. Em `buildImovel`, emitir a tag `<CodigoCliente>` como PRIMEIRA linha de cada `<Imovel>`, antes de `<CodigoImovel>`:

```ts
lines.push(tag("CodigoCliente", CODIGO_CLIENTE));
lines.push(tagOptional("CodigoImovel", (prop.listing_code ?? "").slice(0, 10)));
```

## Intocado

- `feed-zap.ts`, `feed-opennavent.ts`, `feed-common.ts` e as rotas `/feeds/zap.xml` e `/feeds/wimoveis.xml`
- Banco de dados, PropertyForm e `property-export.ts`
- Lógica de CEP (já envia os 8 dígitos sem pontuação)
- Ordem de todas as outras tags e a função `dfPropertyType`

## Resultado esperado

Em `/feeds/dfimoveis.xml`, cada `<Imovel>` começa com:

```text
<Imovel>
  <CodigoCliente>10974</CodigoCliente>
  <CodigoImovel>BB1000</CodigoImovel>
  <TipoImovel>Apartamento</TipoImovel>
  ...
```

## Verificação

- `bunx tsgo --noEmit` e `bun run build`
- Requisição local a `/feeds/dfimoveis.xml`: 200, os 5 imóveis, `<CodigoCliente>10974</CodigoCliente>` como primeira tag de todos, resto do XML inalterado
- Confirmar que `/feeds/zap.xml` e `/feeds/wimoveis.xml` continuam idênticos
