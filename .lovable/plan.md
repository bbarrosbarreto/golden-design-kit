# Ajuste no feed ZAP — omitir tags vazias e exigir logradouro

## 1. `src/lib/property-export.ts`

- Adicionar `street: string` ao tipo `ReadinessInput`.
- Inserir novo item em `evaluateReadiness`:
  - Rótulo: "Logradouro preenchido"
  - Regra: `input.street.trim() !== ""`
  - Reason apropriado para ok/not ok
- Isso eleva o painel de prontidão de 7 para 8 itens e faz imóveis sem `street` falharem na prontidão.

## 2. `src/lib/feed-zap.ts`

- Em `passesReadiness`, incluir `street: prop.street ?? ""` na chamada de `evaluateReadiness`.
- Em `buildImovel`, aplicar `tagOptional` (ou omitir manualmente) a **todas** as tags de texto e número cujo valor possa ser nulo ou string vazia, seguindo a mesma regra já usada para `Complemento`.
- Tags afetadas:
  - `CodigoImovel`
  - `TituloImovel`
  - `TipoImovel`
  - `SubTipoImovel`
  - `CategoriaImovel`
  - `Estado`
  - `Cidade`
  - `Bairro`
  - `Endereco`
  - `Numero`
  - `CEP`
- Tags numéricas opcionais já usam `tagOptional`; manter como está.
- `TipoOferta` continua sendo emitido como `1` porque é obrigatório e fixo.
- `Fotos` e `Videos` continuam sendo emitidos somente quando houver conteúdo.

## 3. Critérios de aceitação

- `/feeds/zap.xml` responde 200 e não contém tags vazias (`<Endereco></Endereco>`, `<Numero></Numero>`, etc.).
- Painel de prontidão mostra 8 itens.
- Imóvel sem `street` preenchido não aparece no feed.

## 4. Não mexer

- Nenhum arquivo além de `src/lib/property-export.ts` e `src/lib/feed-zap.ts`.
