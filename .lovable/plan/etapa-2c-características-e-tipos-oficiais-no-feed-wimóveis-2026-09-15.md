# Etapa 2C — Características e tipos oficiais no feed Wimóveis

A API da Navent foi consultada com as credenciais fornecidas. Os catálogos reais já estão em mãos e substituem os valores provisórios que hoje estão em `feed-opennavent.ts`. As credenciais não entram em nenhum arquivo do projeto.

## Autenticação (registrada só na documentação, sem credencial)

`POST /v1/application/login?grant_type=client_credentials&client_id=…&client_secret=…` devolve `access_token` do tipo bearer, `scope: read write trust`, `expires_in: 315359999` (cerca de 10 anos). As consultas usam `Authorization: Bearer <token>`. O feed em produção não chama a API.

## 1. Catálogos salvos em `docs/navent/`

- `tipopropriedade.json` — Casa (1), Apartamento (2), Terreno (1003), Rurais (1004), Comercial (1005)
- `subtipos-<id>.json` e `caracteristicas-<id>.json` — um par por tipo
- `operacoes.json` — `VENTA`, `ALQUILER`, `ALQUILER_TEMPORAL`, `TRASPASO`
- `ubicaciones.json` — estados do Brasil
- `ubicaciones-distrito-federal.json` — detalhamento do DF

Nenhum arquivo contém credencial.

## 2. Localidades do DF (só registro, sem mudar o gerador)

O DF é `V1-B-247` e traz 31 localidades de nível C. Gama (`V1-C-99993`), Guará (`V1-C-99992`) e Jardim Botânico (`V1-C-1112879`) existem como localidades próprias. **Noroeste não existe** no catálogo — é tratado como bairro de Brasília (`V1-C-99998`). Isso vai para o README; o gerador continua enviando a string `bairro,cidade,estado,Brasil` nesta etapa.

## 3. Mapa de tipos com ids reais

| Nosso tipo | idTipo | idSubTipo |
| --- | --- | --- |
| apartamento | 2 | 1 (Padrão) |
| cobertura | 2 | 26 (Cobertura) |
| casa | 1 | 5 (Padrão) |
| casa_condominio | 1 | 6 (Casa de Condomínio) |
| terreno | 1003 | 8 (Terreno Padrão) |
| comercial | 1005 | 16 (Conjunto Comercial/sala) |
| rural | 1004 | 10 (Chácara) |

O XML passa a emitir `<idTipo>`/`<idSubTipo>` em vez dos nomes.

## 4. Operações

O catálogo brasileiro usa espanhol: venda = `VENTA`, aluguel = `ALQUILER`. O mapa atual (`Venda`/`Aluguel`) estava errado e será corrigido.

## 5. Bloco `<caracteristicas>`

Ids iguais nos 5 tipos, todos "Campo numerico abierto" (usam `<valor>`). Nome oficial exatamente como vem do catálogo:

| Dado nosso | id | nome oficial no catálogo |
| --- | --- | --- |
| bedrooms | CFT2 | `PRINCIPALES|QUARTO` |
| bathrooms | CFT3 | `PRINCIPALES|BANHEIRO` |
| suites | CFT4 | `PRINCIPALES|SUITE` |
| parking_spots | CFT7 | `PRINCIPALES|VAGA` |
| area | CFT100 | `MEDIDAS|AREA_TOTAL` |
| useful_area (ou built_area) | CFT101 | `MEDIDAS|AREA_UTIL` |
| year_built | CFT5 | `PRINCIPALES|IDADE_DO_IMOVEL` |

Regras:

- característica omitida quando o dado é nulo
- `CFT5` é **idade**, não ano: envia `ano atual − year_built`; omitido se negativo ou se `year_built` < 1900
- **salas (`living_rooms`) não é enviado** — não há característica equivalente em nenhum dos 5 catálogos
- bloco inteiro omitido quando nada sobra

## 6. `docs/navent/README.md`

Registra: como obter o token e sua validade (sem credenciais), endpoint e data de consulta de cada catálogo (15/09/2026), de-para dos 7 tipos internos com ids, tabela de características com **id + nome oficial do catálogo** (com destaque para CFT5 ser idade do imóvel), e o achado sobre localidades do DF, inclusive a ausência do Noroeste.

## Arquivos tocados

- `src/lib/feed-opennavent.ts` (mapas, bloco de características, colunas extras no SELECT: bedrooms, bathrooms, suites, parking_spots, year_built)
- `docs/navent/*` (novos)
- `roadmap.md` (Etapa 2C concluída; localidade vira etapa futura)

Não serão tocados: `feed-zap.ts`, `PropertyForm`, banco de dados.

## Verificação

- `/feeds/wimoveis.xml` → 200, bem formado, com `<caracteristicas>` onde houver dados
- todo id usado aparece nos JSON salvos
- `/feeds/zap.xml` byte a byte idêntico
- nenhuma credencial no repositório
