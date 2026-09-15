# Catálogos da API Navent (OpenNavent) — Brasil

Fonte de verdade dos ids usados em `src/lib/feed-opennavent.ts` (feed do Wimóveis).

- Host: `https://api-br-open.navent.com/`
- Data da consulta: **15/09/2026**
- Documentação: https://open-classifieds.notion.site/arg/bra/ e Swagger em `GET /v2/api-docs?group=opennavent-realestate`

## Como refazer a consulta (sem credenciais aqui)

As credenciais (client_id e client_secret) **não ficam no repositório**. Peça-as ao responsável pela conta.

```
POST /v1/application/login?grant_type=client_credentials&client_id=...&client_secret=...
```

Resposta: `{ access_token, token_type: "bearer", expires_in: 315359999, scope: "read write trust" }`.
`expires_in` equivale a ~10 anos, então o token praticamente não expira, mas deve ser tratado como segredo e nunca commitado.

Todas as demais chamadas usam o cabeçalho `Authorization: Bearer <access_token>`.

O feed XML em produção **não** chama esta API — usa apenas os ids registrados aqui.

## Arquivos e endpoints de origem

| Arquivo | Endpoint |
| --- | --- |
| `tipopropriedade.json` | `GET /v1/tipopropriedade` |
| `subtipos-<id>.json` | `GET /v1/tipopropriedade/<id>/subtipos` |
| `caracteristicas-<id>.json` | `GET /v1/tipopropriedade/<id>/caracteristicas` |
| `operacoes.json` | `GET /v1/operacoes` |
| `ubicaciones.json` | `GET /v1/ubicaciones` (equivalente a `/v1/locais`) |
| `ubicaciones-distrito-federal.json` | `GET /v1/locais/V1-B-247` |

## Tipos de imóvel disponíveis para o Brasil

| id | nome oficial | categoria |
| --- | --- | --- |
| 1 | Casa | Residencial |
| 2 | Apartamento | Residencial |
| 1003 | Terreno | Residencial |
| 1004 | Rurais | Residencial |
| 1005 | Comercial | Comercial |

## De-para dos nossos 7 tipos internos (tipo + categoria)

O subtipo depende do **tipo e da categoria** do anúncio, não só do tipo.

| Tipo interno | Categoria | idTipo | idSubTipo | nome oficial do subtipo |
| --- | --- | --- | --- | --- |
| apartamento | `cobertura*` (cobertura, cobertura_duplex, cobertura_triplex) | 2 | 26 | Cobertura |
| apartamento | qualquer outra | 2 | 1 | Padrão |
| cobertura | qualquer | 2 | 26 | Cobertura |
| casa | `sobrado_duplex`, `sobrado_triplex` | 1 | 33 | Sobrado |
| casa | `terrea` ou outra | 1 | 5 | Padrão |
| casa_condominio | qualquer | 1 | 6 | Casa de Condomínio |
| terreno | qualquer | 1003 | 8 | Terreno Padrão |
| comercial | qualquer | 1005 | 16 | Conjunto Comercial/sala |
| rural | qualquer | 1004 | 10 | Chácara |

Notas sobre as categorias de casa (`subtipos-1.json`: 5 Padrão, 6 Casa de Condomínio,
7 Casa de Vila, 33 Sobrado, 37 Quarto):

- **Sobrado existe** no catálogo (33) e é usado para `sobrado_duplex` e `sobrado_triplex`.
- **Não existe subtipo "Térrea"**; a categoria `terrea` continua indo como Padrão (5).
- Em `casa_condominio`, o subtipo Casa de Condomínio (6) tem prioridade sobre Sobrado,
  porque descreve melhor o produto anunciado.

Fallback do gerador quando o tipo é desconhecido: Apartamento / Padrão (2 / 1).

## Operações

`GET /v1/operacoes` devolve, para o Brasil: `VENTA`, `ALQUILER`, `ALQUILER_TEMPORAL`, `TRASPASO`.
Ou seja, os nomes do catálogo estão **em espanhol**, mesmo no ambiente brasileiro.
O feed usa `VENTA` para venda e `ALQUILER` para aluguel.

## Características usadas no feed

Nome oficial copiado literalmente do campo `nombre` do catálogo. Todas as sete são
do tipo `Campo numerico abierto`, portanto o feed envia `<valor>` (nunca `<idValor>`).
Os mesmos ids aparecem nos cinco tipos de imóvel (`caracteristicas-1/2/1003/1004/1005.json`).

| Dado no nosso banco | id | nome oficial no catálogo | tipoDeCaracteristica |
| --- | --- | --- | --- |
| `bedrooms` | `CFT2` | `PRINCIPALES\|QUARTO` | Campo numerico abierto |
| `bathrooms` | `CFT3` | `PRINCIPALES\|BANHEIRO` | Campo numerico abierto |
| `suites` | `CFT4` | `PRINCIPALES\|SUITE` | Campo numerico abierto |
| `parking_spots` | `CFT7` | `PRINCIPALES\|VAGA` | Campo numerico abierto |
| `area` | `CFT100` | `MEDIDAS\|AREA_TOTAL` | Campo numerico abierto |
| `useful_area` (ou `built_area`) | `CFT101` | `MEDIDAS\|AREA_UTIL` | Campo numerico abierto |
| `year_built` | `CFT5` | `PRINCIPALES\|IDADE_DO_IMOVEL` | Campo numerico abierto |

**Atenção ao CFT5.** O nome oficial é `PRINCIPALES|IDADE_DO_IMOVEL` — é a **idade em anos**,
não o ano de construção. Por isso o gerador envia `ano atual − year_built`, e omite a
característica quando o resultado seria negativo ou quando `year_built` for anterior a 1900.

### Sem equivalente no catálogo

- **Salas (`living_rooms`)**: não existe característica de contagem de salas em nenhum dos
  cinco catálogos. Só há checkboxes `AREA_PRIVATIVA|SALA_DE_JANTAR` (20177) e
  `AREAS_COMUNS|FITNESS/SALA_DE_GINASTICA` (10090), que são outra coisa. O dado não é enviado.

### Outros ids numéricos disponíveis (ainda não usados)

`CFT6` (`PRINCIPALES|CONDOMINIO`), `CFT400` (`PRINCIPALES|IPTU`),
`CFT300` (`UNIDADES_DE_DESARROLLO|UNIDADES_DISPONIBLES`), `30001` (`OTROS|ANDARES`,
presente em Casa, Apartamento e Comercial). Há ainda dezenas de checkboxes de
comodidades (`AREA_PRIVATIVA|*`, `AREAS_COMUNS|*`), que usam `<idValor>` 1/0.

## Localidades (levantamento; ainda não usado pelo gerador)

A documentação diz que `<idLocalidade>` tem prioridade sobre `<localidade>` em texto e que
o nível precisa ser "C" (cidade) ou inferior. Hoje o feed envia apenas a string
`bairro,cidade,estado,Brasil`. Mapear o id fica para uma etapa futura.

Distrito Federal: `V1-B-247` (nível B). Tem **31 localidades de nível C**:

Abadiania, Arapoanga, Arniqueira, Brasília, Brazlândia, Candangolândia, Ceilândia,
Cruzeiro, Fercal, Gama, Guará, Itapoã, Jardim Botânico, Miami, Núcleo Bandeirante,
Paranoá, Park, Planaltina, Recanto das Emas, Riacho Fundo, Samambaia, Santa Maria,
Setor Industrial, Sobradinho, São Sebastião, Taguatinga, Varjão, Vicente Pires,
Vila Estrutural, Vila Planalto, Águas Claras.

Sobre as regiões administrativas perguntadas:

| Região | Existe como localidade? | id |
| --- | --- | --- |
| Gama | sim | `V1-C-99993` |
| Guará | sim | `V1-C-99992` |
| Jardim Botânico | sim | `V1-C-1112879` |
| Noroeste | **não** | — (cai em Brasília, `V1-C-99998`) |

Ou seja: o catálogo trata boa parte das RAs como "cidade", mas não todas. Bairros do
Plano Piloto e do Noroeste precisariam ser enviados sob Brasília (`V1-C-99998`).

## Quando revisar

Se a Navent recusar anúncios por tipo, subtipo ou característica, refaça as consultas
acima, substitua os JSON deste diretório e compare com as tabelas — os ids podem mudar.
