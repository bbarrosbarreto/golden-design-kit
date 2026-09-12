# Etapa 2B — Feed Wimóveis no formato OpenNavent

Feed novo em `/feeds/wimoveis.xml`, formato OpenNavent (raiz `<OpenNavent>`), consumido pelo Wimóveis (Grupo QuintoAndar). NÃO é o padrão ZAP: a montagem do XML é nova. Só se reaproveitam helpers genéricos.

## 1. Extração de helpers compartilhados

Novo arquivo `src/lib/feed-common.ts` com o que hoje é genérico dentro de `feed-zap.ts`:

- `escapeXml`, `cdata`, `tag`, `tagOptional`, `intOrNull`
- `fetchEligible(portal)` — busca paginada no Supabase (active, status=disponivel, export_enabled, portal em `export_portals`), mudando apenas a lista de colunas para o que cada feed precisa
- `orderedImages(prop)` — ordem do site, capa primeiro
- `passesReadiness(prop, imageCount)` — os 8 itens do painel, incluindo logradouro

`feed-zap.ts` passa a importar esses helpers. O XML que ele gera não muda em nenhum caractere — critério de aceitação é o feed do DF Imóveis continuar idêntico.

## 2. Novo gerador `src/lib/feed-opennavent.ts`

Função `generateOpenNaventFeed(portal: string): Promise<string>`, chamada com `"wimoveis"`.

### Mapas isolados e comentados

No topo do arquivo, em um único ponto fácil de trocar:

- `NAVENT_TYPE_MAP`:
  - apartamento → Apartamento / Padrão
  - cobertura → Apartamento / Cobertura
  - casa → Casa / Padrão
  - casa_condominio → Casa / Condominio
  - terreno → Terreno / Padrão
  - comercial → Comercial / Padrão
  - rural → Chácara / Padrão
- `NAVENT_OPERATIONS = { venda: "Venda", aluguel: "Aluguel" }`
- `NAVENT_CONTACT_EMAIL = "brunobarreto.corretor@gmail.com"`

Comentário em português deixando claro que os valores são PROVISÓRIOS: os oficiais vêm do endpoint `/v1/tipopropriedade` da API Navent (credencial ainda não obtida), e `operacao` pode acabar sendo "VENTA"/"ALQUILER".

### Elegibilidade

Idêntica ao ZAP: mesmo `fetchEligible`, mesmo `passesReadiness`, mesma exigência de ao menos uma área preenchida. Filtro de portal: `wimoveis`.

### Estrutura

```text
<?xml version="1.0" encoding="UTF-8"?>
<OpenNavent>
  <dataModificacao><![CDATA[1726000000000]]></dataModificacao>
  <Imoveis>
    <Imovel>...</Imovel>
  </Imoveis>
</OpenNavent>
```

`dataModificacao`: `Date.now()` — Unix timestamp em MILISSEGUNDOS, em CDATA.

### Campos por `<Imovel>`

- `codigoAnuncio` = listing_code, sem acentos (normalize NFD + strip), até 100 caracteres
- `codigoReferencia` = slug (coluna `slug` entra no SELECT deste feed)
- `titulo` = title em CDATA
- `descricao` = description em CDATA
- `tipoPropriedade` > `tipo` e `subTipo` em CDATA, via `NAVENT_TYPE_MAP` (tipo desconhecido cai em Apartamento/Padrão)
- `precos` > um ou dois `preco`:
  - purpose `venda` → `<preco>` com quantidade = price, `<operacao>Venda</operacao>`; se rent_price > 0, segundo `<preco>` com `<operacao>Aluguel</operacao>`
  - purpose `aluguel` → um `<preco>` com quantidade = price, operação Aluguel
  - `<moeda>BRL</moeda>` sempre; quantidade inteira, arredondada para baixo
- `localizacao`:
  - `endereco` = street + ", " + street_number quando houver número
  - `localidade` = `bairro,cidade,estado,Brasil` — vírgula sem espaço depois
  - `codigoPostal` = 8 dígitos
  - `mostrarMapa` = `APROXIMADO`
  - `latitude`/`longitude` omitidos se nulos; validados nas faixas -90..90 e -180..180 (fora da faixa, omite)
- `multimidia`:
  - `imagens` > `imagem` com `urlImagem` (URL pública em CDATA) e `titulo` (rótulo da categoria da imagem, opcional — omitido quando vazio)
  - **limite de 50 imagens por anúncio** — excedente é cortado
  - `videos` > `video` com `codigoVideo` contendo SOMENTE o ID do YouTube em CDATA. Extração cobre `youtu.be/ID`, `youtube.com/watch?v=ID`, `youtube.com/embed/ID` (regex sobre o path/query, ignorando parâmetros extras como `si=`). Se não extrair, omite o bloco `<videos>` inteiro.
- `publicacao` > `<tipoPublicacao>SIMPLE</tipoPublicacao>`
- `publicador` > `nomeContato` Bruno Barreto, `telefoneContato` 61 99935-0888, `emailContato` da constante

Regra das tags vazias idêntica à do ZAP: valor nulo ou string vazia → tag omitida (via `tagOptional` compartilhado).

### Sem `<caracteristicas>` nesta etapa

Quartos, banheiros, vagas e áreas ficam de fora: são códigos de catálogo (ex: CFT100) que só saem da API autenticada da Navent. Código inventado derruba o anúncio. Isso vira a Etapa 2C no roadmap.

### Falhas

Falha de rede/parse ou zero elegíveis → 200 com `<Imoveis></Imoveis>` (com `dataModificacao` preenchido), nunca erro nem HTML.

## 3. Nova rota `src/routes/feeds.wimoveis[.]xml.ts`

Casca fina, mesmo molde de `feeds.zap[.]xml.ts`:

- `createFileRoute("/feeds/wimoveis.xml")`, `server.handlers.GET`
- Chama `generateOpenNaventFeed("wimoveis")`
- Headers: `Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=900`

## 4. Roadmap

- Marcar Etapa 2: "Feed Wimóveis (OpenNavent)" como concluído
- Criar Etapa 2C: bloco `<caracteristicas>` do OpenNavent, dependente do catálogo de códigos da API Navent autenticada (quartos, banheiros, vagas, áreas)

## 5. Verificação

- Build passa
- `GET /feeds/wimoveis.xml` → 200, `application/xml`, XML bem formado parseado por parser; hoje sai vazio (nenhum imóvel tem `wimoveis` marcado)
- Conferir `dataModificacao` em milissegundos (13 dígitos)
- `GET /feeds/zap.xml` → resposta idêntica à de antes da refatoração (comparação byte a byte)
- Nenhuma tag vazia em nenhum dos dois feeds

## 6. Não mexer

- Nenhum SQL, nenhuma migration
- PropertyForm e páginas públicas
- Lógica de negócio de `feed-zap.ts` além da importação dos helpers extraídos
