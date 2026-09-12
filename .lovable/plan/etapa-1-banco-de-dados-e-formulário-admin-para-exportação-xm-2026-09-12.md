# Etapa 1 — Banco de dados e formulário admin para exportação XML

## Objetivo
Preparar a tabela `properties` e o formulário admin com todos os campos necessários para futura geração de XML para portais imobiliários (DF Imóveis, ZAP, VivaReal, OLX). Nesta etapa não há rotas de feed nem geração de XML.

## 1. Migration Supabase

### Endereço estruturado
`street`, `street_number`, `complement`, `neighborhood`, `postal_code` (text), `city` (text not null default 'Brasília'), `state` (text not null default 'DF'), `latitude`, `longitude` (numeric).

### Valores separados
`rent_price`, `condo_fee`, `iptu` (numeric), `year_built` (smallint), `living_rooms` (integer).

### Categoria fina ZAP
`category` (text not null default 'padrao') com check constraint contendo **exatamente estes 7 valores, sem acréscimos**:
`padrao`, `terrea`, `sobrado_duplex`, `sobrado_triplex`, `cobertura`, `cobertura_duplex`, `cobertura_triplex`.

### Controle de exportação
`export_enabled` (boolean not null default false), `export_portals` (text[] not null default '{}'), `listing_code` (text unique).
Sequência `public.listing_code_seq` iniciando em 1000; default `'BB' || nextval(...)`; backfill dos registros existentes; índice `properties_export_idx` em `(export_enabled, active, status)`.

Nenhuma coluna existente é renomeada e o check constraint de `purpose` não é alterado.

## 2. Regra de preço (crítico)

Regra a ser documentada em comentário no código, para uso do gerador de XML na Etapa 2:

- `purpose = 'venda'` → `price` é o valor de **venda**
- `purpose = 'aluguel'` → `price` é o valor do **aluguel mensal**
- `rent_price` é usado **apenas** quando o imóvel é de venda e também está disponível para locação

No formulário:
- O rótulo de `price` muda conforme `purpose`: "Valor de venda" ou "Valor do aluguel (mensal)"
- `rent_price` só aparece quando `purpose = 'venda'`, com rótulo "Também aceita aluguel? Valor mensal (opcional)"
- Quando `purpose = 'aluguel'`, `rent_price` não é exibido e é gravado como `null`

Dados existentes não são migrados e a exibição pública de preço não muda.

## 3. Formulário admin (`src/components/admin/PropertyForm.tsx`)

### Tipos e defaults
Novos campos em `PropertyRow` e `FormValues`; `empty` com `city: "Brasília"`, `state: "DF"`, `category: "padrao"`, `export_enabled: false`, `export_portals: []`.

### Seção "Endereço"
Logradouro, Número, Complemento, Bairro (obrigatório visualmente), CEP (obrigatório), Cidade, Estado, Latitude, Longitude.

**CEP:** a máscara `00000-000` existe apenas na exibição do input. No banco grava-se **somente os 8 dígitos, sem traço**, com validação de 8 dígitos antes de salvar.

### Seção "Exportação para portais"
- Switch "Exportar para portais" (`export_enabled`), default desligado
- Checkboxes: `'dfimoveis'` → "DF Imóveis"; `'grupozap'` → "ZAP / VivaReal / OLX"
- Select "Categoria" (`category`): Padrão, Térrea, Sobrado/Duplex, Sobrado/Triplex, Cobertura, Cobertura Duplex, Cobertura Triplex
- Numéricos: Valor do aluguel (`rent_price`, condicional), Condomínio (`condo_fee`), IPTU (`iptu`), Ano de construção (`year_built`), Salas (`living_rooms`)

### Código do anúncio
Campo somente leitura rotulado "Código do anúncio nos portais". Em anúncio novo ainda não salvo, exibe "gerado ao salvar".
`listing_code` **nunca** entra no payload — nem no insert nem no update. Quem gera é o default da sequência.

## 4. Painel de prontidão

Checklist em tempo real, com ✓ ou ✗ e motivo em cada item:
- CEP preenchido (8 dígitos)
- Bairro preenchido
- Descrição entre 50 e 3000 caracteres
- Pelo menos 5 imagens
- Título entre 10 e 100 caracteres
- Preço de venda OU de aluguel preenchido
- Ao menos um portal selecionado

Se algum item falhar, o switch "Exportar para portais" fica desabilitado com a mensagem "Complete os itens acima para exportar".

Com `export_enabled = true` e `export_portals` vazio, o save é bloqueado com mensagem clara.

## 5. Regras de `toPayload`

- Se o checklist de prontidão não passar por completo, força `export_enabled = false` e `export_portals = []`, independentemente do estado da tela
- `city` em branco → grava "Brasília"; `state` em branco → grava "DF" (ambos not null no banco)
- `postal_code` → apenas dígitos
- `rent_price` → `null` quando `purpose = 'aluguel'`
- `listing_code` → nunca incluído

## 6. Critérios de aceitação

- A migration roda sem erro e os imóveis existentes recebem `listing_code`
- O formulário salva e recarrega todos os campos novos sem perda
- Nada no site público quebra
- `export_enabled` permanece `false` em todos os registros após a migration

## 7. Não mexer

- `src/routes/sitemap[.]xml.ts`
- Layout público de `/imoveis` e `/imoveis/$slug`
- Nomes de colunas existentes
- Check constraint de `purpose`
- Nenhuma rota de feed ou geração de XML nesta etapa
