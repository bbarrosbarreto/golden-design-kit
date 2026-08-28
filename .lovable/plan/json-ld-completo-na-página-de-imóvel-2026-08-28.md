# JSON-LD completo na página de imóvel

Reescrever o structured data de `/imoveis/$slug` com os dados reais do imóvel e adicionar a trilha de navegação (breadcrumb). Nada muda visualmente.

## O que será feito

1. **Novo helper `src/lib/property-schema.ts`** com duas funções puras:
   - `buildListingSchema(prop, url)` → objeto `RealEstateListing`
   - `buildBreadcrumbSchema(prop, url)` → objeto `BreadcrumbList`
   Toda chave sem dado é omitida (nunca `null`, `""` ou `0`).

2. **`src/routes/imoveis.$slug.tsx`**: o `head()` passa a emitir dois blocos `application/ld+json` (listing + breadcrumb) usando o helper, a partir do `loaderData`. Meta tags, layout, loader e formulário permanecem intactos.

## Detalhes técnicos

- O `loader` já faz `select("*")`, então `features`, `status` e `published_at` já vêm do banco; apenas o type `PropertyDetail` será estendido com esses três campos.
- Imagens: `normalizePropImages` + `groupImagesByCategory` (mesma ordenação da página), capa primeiro, máximo 10 URLs absolutas.
- `offers`: `price` numérico puro, `priceCurrency: "BRL"`, `availability` (`InStock` para `disponivel`, `OutOfStock` para `vendido`/`reservado`), `businessFunction` (`#Sell` para venda, `#LeaseOut` para aluguel) e `seller` como `RealEstateAgent` com telefone e CRECI-DF 34060 em `identifier`. Sem `price`, o bloco `offers` sai sem a chave de preço; sem `status`/`purpose`, as respectivas chaves são omitidas.
- `mainEntity` por tipo: `apartamento`/`cobertura` → `Apartment`; `casa`/`casa_condominio` → `SingleFamilyResidence`; `terreno`/`comercial` → sem `mainEntity`.
- Dentro de `mainEntity`: `numberOfBedrooms`, `numberOfBathroomsTotal`, `numberOfRooms`, `floorSize` (`QuantitativeValue`, `unitCode: "MTK"`, usando `built_area` → `useful_area` → `area`), `address` (`PostalAddress` com `streetAddress`, região como `addressLocality`, `addressRegion: "DF"`, `addressCountry: "BR"`) e `amenityFeature` (um `LocationFeatureSpecification` por item de `features`, mais "Vagas de garagem" e "Suítes" quando houver).
- Breadcrumb: Início (`/`) → Imóveis (`/imoveis`) → título do imóvel (URL atual), com `position`, `name` e `item`.
- Todas as URLs absolutas em `https://brunobarretoimoveis.com.br`.

## Verificação

- `bun run build:dev` passa.
- HTML servido de um imóvel real contém os dois blocos `ld+json` com preço, quartos, banheiros, área, endereço e fotos.
- Imóvel do tipo terreno gera listing válido sem `mainEntity`.
- Imóvel sem preço ou sem fotos não emite chaves vazias.
