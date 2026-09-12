# Etapa 1 — Banco de dados e formulário admin para exportação XML

## Objetivo
Preparar a tabela `properties` e o formulário admin com todos os campos necessários para futura geração de XML para portais imobiliários (DF Imóveis, ZAP, VivaReal, OLX), sem criar rotas de feed nem gerar XML nesta etapa.

## 1. Migration Supabase

Aplicar a migration fornecida, que adiciona:

### Endereço estruturado
- `street` (text)
- `street_number` (text)
- `complement` (text)
- `neighborhood` (text)
- `city` (text, not null default 'Brasília')
- `state` (text, not null default 'DF')
- `postal_code` (text)
- `latitude` (numeric)
- `longitude` (numeric)

### Campos de valores separados
- `rent_price` (numeric)
- `condo_fee` (numeric)
- `iptu` (numeric)
- `year_built` (smallint)
- `living_rooms` (integer)

### Categoria fina ZAP
- `category` (text, not null default 'padrao', check constraint)

### Controle de exportação
- `export_enabled` (boolean, not null default false)
- `export_portals` (text[], not null default '{}')
- `listing_code` (text unique, default 'BB' || nextval('public.listing_code_seq'))
- Sequência `public.listing_code_seq` iniciando em 1000
- Backfill de `listing_code` para imóveis existentes
- Índice `properties_export_idx` em `(export_enabled, active, status)`

## 2. Formulário admin (`src/components/admin/PropertyForm.tsx`)

### Tipos e valores padrão
- Adicionar os novos campos em `PropertyRow`.
- Adicionar campos correspondentes em `FormValues` (todos como string, exceto `export_enabled` boolean, `export_portals` string[] e `category` string).
- Preencher o objeto `empty` com defaults:
  - `city`: "Brasília"
  - `state`: "DF"
  - `export_enabled`: false
  - `export_portals`: []
  - `category`: "padrao"

### Conversão
- `toForm`: ler os novos campos do banco, convertendo numéricos para string vazia quando null.
- `toPayload`: converter strings de volta para number/null, manter `export_enabled`, `export_portals`, `category`, e garantir `listing_code` não seja sobrescrito em updates.

### Nova seção "Endereço"
Campos em grid de 2 colunas (1 coluna no mobile):
- Logradouro (`street`)
- Número (`street_number`)
- Complemento (`complement`)
- Bairro (`neighborhood`) — marcado como obrigatório visualmente
- CEP (`postal_code`) — obrigatório, máscara 00000-000
- Cidade (`city`, default "Brasília")
- Estado (`state`, default "DF")
- Latitude (`latitude`)
- Longitude (`longitude`)

### Nova seção "Exportação para portais"
- Switch "Exportar para portais" (`export_enabled`), default desligado.
- Checkboxes de portais (`export_portals`):
  - valor `'dfimoveis'` → rótulo "DF Imóveis"
  - valor `'grupozap'` → rótulo "ZAP / VivaReal / OLX"
- Select "Categoria" (`category`):
  - Padrão, Térrea, Sobrado/Duplex, Sobrado/Triplex, Cobertura, Cobertura Duplex, Cobertura Triplex
- Campos numéricos:
  - Valor do aluguel (`rent_price`)
  - Condomínio (`condo_fee`)
  - IPTU (`iptu`)
  - Ano de construção (`year_built`)
  - Salas (`living_rooms`)

### Painel de prontidão
Dentro da seção "Exportação para portais", exibir checklist em tempo real com ✓ ou ✗:
- CEP preenchido
- Bairro preenchido
- Descrição entre 50 e 3000 caracteres
- Pelo menos 5 imagens
- Título entre 10 e 100 caracteres
- Preço de venda OU de aluguel preenchido

Se qualquer item falhar:
- Desabilitar o switch "Exportar para portais"
- Mostrar mensagem "Complete os itens acima para exportar"

## 3. Critérios de aceitação

- A migration roda sem erro e os imóveis existentes recebem `listing_code`.
- O formulário salva e recarrega todos os campos novos sem perda.
- Nada no site público quebra.
- `export_enabled` permanece `false` em todos os registros após a migration.

## 4. Não mexer

- Não alterar `src/routes/sitemap[.]xml.ts`
- Não alterar o layout público de `/imoveis` nem `/imoveis/$slug`
- Não renomear nenhuma coluna existente
- Não criar rotas de feed nem gerar XML nesta etapa
