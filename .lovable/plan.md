# Etapa 1.5 — Categoria por tipo, tipo "Rural / Chácara" e limpeza

Sem rotas de feed e sem geração de XML nesta etapa.

## 1. Categoria depende do tipo

Hoje o select de Categoria mostra as 7 opções sempre, então dá para salvar
apartamento como "Sobrado/Duplex" — combinação que os portais recusam.

Novo comportamento:

| Tipo | Categorias válidas |
| --- | --- |
| Apartamento | Padrão, Cobertura, Cobertura Duplex, Cobertura Triplex |
| Cobertura | Cobertura, Cobertura Duplex, Cobertura Triplex |
| Casa | Térrea, Sobrado/Duplex, Sobrado/Triplex |
| Casa em condomínio | Térrea, Sobrado/Duplex, Sobrado/Triplex |
| Terreno | Padrão |
| Comercial | Padrão, Térrea, Sobrado/Duplex |
| Rural / Chácara | Padrão |

Ao trocar o tipo, se a categoria atual não valer para o novo tipo, ela volta
automaticamente para a primeira opção válida. Na hora de salvar, o formulário
confere de novo e bloqueia com aviso caso a combinação seja inválida.

## 2. Novo tipo "Rural / Chácara"

Ponto importante encontrado na revisão: o banco já aceita 6 tipos
(apartamento, cobertura, casa, casa em condomínio, terreno, comercial), mas o
site e o painel só mostram 3 (Apartamento, Casa, Terreno). Junto com o
"rural", vou passar a listar os 7 tipos em todos os lugares, para o painel e o
site ficarem coerentes com o banco.

Lugares que passam a conhecer os 7 tipos:

- Formulário de cadastro (select de Tipo)
- Lista do painel de imóveis (coluna Tipo)
- Página pública de listagem: etiqueta do card; o filtro de tipo lista apenas
  os tipos que têm imóvel ativo no momento (o painel admin continua mostrando
  os 7 sempre)
- Página de detalhe do imóvel (etiqueta e textos)
- Perguntas frequentes sugeridas automaticamente
- Categorias de fotos e dados estruturados (Google)

Campos por tipo: cobertura e casa em condomínio seguem as regras de
apartamento e casa; comercial e rural seguem as regras de casa (área do
terreno, área construída, área útil).

## 3. Banco — nada a fazer

A regra do banco já aceita os 7 tipos e o imóvel de teste BB1005 já foi
apagado. Nenhum SQL será gerado nem executado nesta etapa.

Nenhum dos 5 imóveis existentes muda de tipo ou de preço.

## Detalhes técnicos

- `src/lib/property-images.ts`: `PropertyType` passa a ter os 7 valores;
  `PROPERTY_CATEGORIES` ganha entradas para `cobertura` (igual apartamento),
  `casa_condominio`, `comercial` e `rural` (baseadas em casa).
- `src/lib/property-export.ts`: novo `categoriesForType(type)` derivado de
  `LISTING_CATEGORIES` (os 7 valores do check continuam iguais) + helper
  `firstCategoryFor(type)`.
- `src/components/admin/PropertyForm.tsx`: select de Tipo com 7 itens; select
  de Categoria alimentado por `categoriesForType`; `useEffect` corrige a
  categoria ao trocar o tipo; `toPayload` normaliza; mutation lança erro se a
  combinação for inválida. Condicionais `isTerreno`/`isCasa`/`isApto`
  agrupadas em constantes por família de tipo.
- Rótulos: extrair um único `PROPERTY_TYPE_LABELS` em `property-images.ts` e
  usá-lo em `admin/imoveis.tsx`, `imoveis.index.tsx` (incluindo os
  `SelectItem` do filtro), `imoveis.$slug.tsx` e `property-faq.ts`.
- `src/lib/property-schema.ts`: `MAIN_ENTITY_TYPE` ganha `comercial`,
  `terreno` e `rural` com os tipos schema.org equivalentes.
- Verificação: `bunx tsgo --noEmit` e `bun run build:dev`.
