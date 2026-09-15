# Etapa 2C — Características e tipos oficiais no feed Wimóveis

A API da Navent foi consultada agora com as credenciais fornecidas. Os catálogos reais já estão em mãos e substituem os valores provisórios que hoje estão em `feed-opennavent.ts`. As credenciais não entram em nenhum arquivo do projeto: só foram usadas nas chamadas desta investigação.

## Como a autenticação funciona (registrado apenas na documentação, sem credencial)

`POST /v1/application/login?grant_type=client_credentials&client_id=…&client_secret=…` devolve um `access_token` do tipo bearer. As consultas de catálogo usam `Authorization: Bearer <token>`. O feed em produção não chama a API — só usa os ids salvos.

## 1. Catálogos salvos em `docs/navent/`

- `tipopropriedade.json` — 5 tipos: Casa (1), Apartamento (2), Terreno (1003), Rurais (1004), Comercial (1005)
- `subtipos-<id>.json` — um por tipo
- `caracteristicas-<id>.json` — um por tipo
- `operacoes.json` — `VENTA`, `ALQUILER`, `ALQUILER_TEMPORAL`, `TRASPASO`

Nenhum desses arquivos contém credencial.

## 2. Correção do mapa de tipos (ids reais)

Os nomes que eu havia inventado saem; entram `idTipo` e `idSubTipo` numéricos:

| Nosso tipo | idTipo | idSubTipo |
| --- | --- | --- |
| apartamento | 2 | 1 (Padrão) |
| cobertura | 2 | 26 (Cobertura) |
| casa | 1 | 5 (Padrão) |
| casa_condominio | 1 | 6 (Casa de Condomínio) |
| terreno | 1003 | 8 (Terreno Padrão) |
| comercial | 1005 | 16 (Conjunto Comercial/sala) |
| rural | 1004 | 10 (Chácara) |

O XML passa a emitir `<idTipo>` e `<idSubTipo>` em vez de `<tipo>`/`<subTipo>` por nome.

## 3. Correção das operações

O catálogo brasileiro usa espanhol: venda = `VENTA`, aluguel = `ALQUILER`. O mapa atual (`Venda`/`Aluguel`) estava errado e será corrigido.

## 4. Bloco `<caracteristicas>`

Ids confirmados, iguais para os 5 tipos (todos "Campo numérico aberto", portanto usam `<valor>`):

| Dado nosso | id Navent |
| --- | --- |
| bedrooms | CFT2 |
| bathrooms | CFT3 |
| suites | CFT4 |
| parking_spots | CFT7 |
| area (total) | CFT100 |
| useful_area, ou built_area quando útil for nula | CFT101 |
| year_built | CFT5 (idade do imóvel) |

Regras aplicadas:

- característica omitida quando o dado é nulo no nosso banco
- `CFT5` é **idade do imóvel**, não ano: será enviado `ano atual − year_built`, omitido se der negativo ou se `year_built` for implausível (< 1900)
- **salas (`living_rooms`) não será enviado**: não existe característica correspondente em nenhum dos 5 catálogos. Enviar id inventado derrubaria o anúncio
- o bloco inteiro é omitido quando nenhuma característica sobra

## 5. Documentação

`docs/navent/README.md` com: endpoint de cada catálogo, data da consulta (15/09/2026), tabela de-para dos 7 tipos internos, tabela de ids de características, e a nota de que `living_rooms` não tem equivalente. Sem credenciais.

## Arquivos tocados

- `src/lib/feed-opennavent.ts` (mapas, novo bloco de características, colunas extras no SELECT: bedrooms, bathrooms, suites, parking_spots, year_built)
- `docs/navent/*` (novos)
- `roadmap.md` (Etapa 2C concluída)

Não serão tocados: `feed-zap.ts`, `PropertyForm`, banco de dados.

## Verificação

- `/feeds/wimoveis.xml` → 200, XML bem formado, com `<caracteristicas>` nos imóveis que têm os dados
- todo id usado aparece nos JSON salvos
- `/feeds/zap.xml` byte a byte idêntico ao atual
- nenhuma credencial em nenhum arquivo do repositório
