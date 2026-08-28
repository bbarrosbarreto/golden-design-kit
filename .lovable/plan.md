# Ordem de apresentação das fotos de imóveis

Adicionar controle de ordem às fotos: cada foto ganha um número dentro da sua categoria, e as seções de fotos podem ser reordenadas por imóvel. A página pública não muda nesta etapa.

## 0. Banco de dados

Como o Supabase deste projeto é externo, a migration precisa ser executada por você no SQL Editor (como já foi feito com a coluna `address`):

```sql
alter table public.properties
  add column if not exists image_category_order jsonb not null default '[]'::jsonb;
```

Nada mais muda no schema. `images` continua `jsonb`, apenas passa a gravar a chave `order` dentro de cada objeto.

## 1. `src/lib/property-images.ts`

- `PropImage` passa a ser `{ url, category, order }`.
- `normalizePropImages`: quando `order` estiver ausente ou inválido, atribui o próximo número livre da categoria conforme a posição no array — nunca fica indefinido.
- Novas funções:
  - `defaultCategoryOrder(type)` — slugs de `categoriesFor(type)` na ordem declarada.
  - `resolveCategoryOrder(type, saved)` — usa os slugs salvos válidos, acrescenta os que faltam na ordem padrão e sempre remove `capa`.
  - `groupImagesByCategory(images, type, savedOrder)` — `[{ category, label, images }]` ordenado por categoria e, dentro dela, por `order` crescente; categorias vazias são omitidas.
  - `findDuplicateOrders(images)` — pares `categoria + order` repetidos.

## 2. `src/components/admin/ImageUploader.tsx`

- Upload atribui `order` = maior order da categoria "outros" + 1.
- Em cada card, abaixo do Select de categoria: Select ~65% + `<Input type="number" min={1}>` rotulado "Ordem" ~35%, lado a lado.
- Trocar a categoria de uma foto recalcula o `order` para o próximo número livre na categoria de destino.
- Duplicados (`findDuplicateOrders`): `border-destructive` no Input e mensagem "Número repetido nesta categoria" em `text-destructive text-xs`.
- Abas por categoria exibem as fotos já ordenadas por `order`.
- Nova prop opcional `onValidityChange?: (valid: boolean) => void`, disparada quando a lista de duplicados muda.

## 3. `src/components/admin/PropertyForm.tsx`

- `image_category_order: string[]` no estado do formulário, carregado do registro e salvo no submit.
- Abaixo do ImageUploader, bloco "Ordem das seções na página":
  - lista vertical das categorias de `resolveCategoryOrder(type, valor_salvo)` que têm ao menos 1 foto;
  - cada linha: nome da categoria, contador de fotos e botões ChevronUp/ChevronDown (`lucide-react`) para mover;
  - primeiro item com "subir" desabilitado, último com "descer" desabilitado;
  - botão `variant="ghost"` "Restaurar ordem padrão" que limpa o array;
  - ajuda em `text-muted-foreground text-xs`: "Define a ordem em que os blocos de fotos aparecem na página do imóvel."
- `onValidityChange` do ImageUploader: com duplicados, botão Salvar desabilitado e `<Alert variant="destructive">` no topo: "Corrija os números de ordem repetidos antes de salvar."

## Fora do escopo

- `src/routes/imoveis.$slug.tsx` (página pública) — próxima etapa.
- `development-images.ts` e o admin de empreendimentos.
- Migration de dados: imóveis antigos sem `order` são resolvidos em tempo de leitura.

## Detalhes técnicos

- Sem cores hardcoded; apenas tokens `primary`, `muted-foreground`, `destructive`, `border`, `surface`.
- `Alert` já existe em `src/components/ui/alert.tsx`.
- Se a coluna `image_category_order` ainda não existir no banco no momento do salvamento, o insert/update falha com erro de schema cache — por isso a migration vem primeiro.
