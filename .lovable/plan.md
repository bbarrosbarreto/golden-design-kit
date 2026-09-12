# Feed ZAP sem tags vazias, logradouro obrigatório, tipo Rural, JPEG no upload e campos obrigatórios

## 1. Nunca emitir tag vazia — `src/lib/feed-zap.ts`

Em `buildImovel`, todas as tags de texto passam a usar `tagOptional` (mesma regra do Complemento): `CodigoImovel`, `TituloImovel`, `TipoImovel`, `SubTipoImovel`, `CategoriaImovel`, `Estado`, `Cidade`, `Bairro`, `Endereco`, `Numero`, `CEP`. `Bairro` e `Observacao` (CDATA) só saem se houver texto. Tags numéricas já são opcionais. `TipoOferta` continua fixo em 1. `Fotos`/`Videos` só com conteúdo.

## 2. Logradouro exigido — `src/lib/property-export.ts` + `feed-zap.ts`

- `ReadinessInput` ganha `street: string`.
- `evaluateReadiness` ganha o item "Logradouro preenchido" (`street.trim() !== ""`). O painel passa a ter 8 itens.
- `passesReadiness` no feed envia `street: prop.street ?? ""`. Imóvel sem logradouro sai do feed.
- `PropertyForm` passa `street` ao `evaluateReadiness` (ajuste mínimo para compilar).

## 3. Tipo "Rural / Chácara" não aparece — diagnóstico

Leitura do código atual confirma que **não há outra lista hard-coded**: o select de Tipo usa `PROPERTY_TYPES.map` (7 tipos) e o select de Categoria usa `typeCategories = categoriesForType(type)`. O comportamento descrito (3 tipos, 7 categorias sem filtro) é o da versão **anterior** à Etapa 1.5 — o site publicado em brunobarretoimoveis.com.br ainda não recebeu essa alteração.

Ação: nenhuma correção de código é necessária; verificar em Playwright no preview local que o select lista 7 tipos e que Terreno mostra apenas "Padrão", e então **republicar** o site ao final desta etapa. Se após publicar o problema persistir, investigar de novo.

## 4. Converter imagens para JPEG — `src/components/admin/ImageUploader.tsx`

Nova função `toJpeg(file)` executada antes de cada upload:

1. Decodifica com `createImageBitmap` (fallback `Image` + `URL.createObjectURL`).
2. Redimensiona para no máximo 1920px no maior lado, mantendo proporção.
3. Desenha em `canvas` e exporta com `toBlob("image/jpeg", 0.85)`.
4. Envia o blob com `contentType: "image/jpeg"` e caminho `${uuid}-${nome-sem-extensão}.jpg`.
5. Se decodificar/exportar falhar (ex.: HEIC), `toast.error("Não foi possível converter X. Envie em JPG ou PNG.")` e o arquivo **não** é enviado.

O componente é compartilhado com o formulário de empreendimentos; a conversão vale para os dois (comportamento desejável e sem impacto no modelo de dados). Imagens já existentes não são migradas.

## 5. Campos obrigatórios quando a exportação está ligada — `PropertyForm.tsx`

Com o switch "Exportar para portais" **ligado**, o salvamento é bloqueado e o campo fica em erro se faltar:

- Título 10–100 caracteres
- Descrição 50–3000 caracteres
- Bairro, CEP (8 dígitos), Logradouro, Cidade, Estado
- Número é opcional (placeholder "S/N se não houver"); no feed, número vazio omite a tag
- Ao menos uma área (terreno / construída / útil, conforme o tipo)
- Preço maior que zero (venda ou aluguel)
- Mínimo 5 imagens
- Quartos e banheiros para tipos residenciais (apartamento, cobertura, casa, casa_condominio)

Com o switch desligado, nada disso bloqueia (cadastro de rascunho continua livre; título e slug seguem obrigatórios como hoje).

Implementação:

- Função `validateForExport(values, imageCount)` retornando `{ campo: mensagem }`; chamada em `onSubmit` quando `export_enabled` é true; erros aplicados via `setError` do react-hook-form e o submit é interrompido com toast "Preencha os campos obrigatórios para exportação".
- Cada campo da lista mostra `<p className="text-sm text-destructive">` com a mensagem abaixo do input, e o `Label` recebe " *" quando `exportEnabled` é true (título já tem asterisco fixo).
- Erros são limpos ao editar o campo (`clearErrors`) e quando o switch é desligado.
- O `evaluateReadiness` continua existindo e alimentando o painel; os itens novos (número, cidade, estado, área, quartos/banheiros) ficam apenas na validação do formulário, sem alterar o gerador do feed além do logradouro.

## 6. Verificação

- `tsgo` + build.
- `/feeds/zap.xml`: 200, XML bem formado, nenhuma tag vazia.
- Playwright no admin local: 7 tipos no select; Terreno → Categoria só "Padrão"; com exportação ligada e logradouro vazio, save bloqueado com erro no campo; painel com 8 itens.
- Upload de PNG/WEBP de teste chega ao Storage como `.jpg` (verificado via URL retornada).

## 7. Arquivos tocados

`src/lib/property-export.ts`, `src/lib/feed-zap.ts`, `src/components/admin/PropertyForm.tsx`, `src/components/admin/ImageUploader.tsx`, `roadmap.md`. Nenhum SQL.
