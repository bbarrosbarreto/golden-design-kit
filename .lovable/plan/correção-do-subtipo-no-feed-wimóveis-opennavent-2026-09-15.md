# Correção do subtipo no feed Wimóveis (OpenNavent)

O gerador escolhe o subtipo olhando só o tipo do imóvel e ignora a categoria. Por isso o BB1000 (apartamento + Cobertura Duplex) sai como "Padrão" (26 esperado, 1 enviado).

## O que muda

`src/lib/feed-opennavent.ts` passa a decidir tipo e subtipo com tipo **e** categoria, como o feed do DF Imóveis já faz:

| Tipo + categoria | idTipo | idSubTipo |
| --- | --- | --- |
| apartamento + categoria começando com "cobertura" | 2 | 26 (Cobertura) |
| cobertura (qualquer categoria) | 2 | 26 (Cobertura) |
| apartamento + qualquer outra categoria | 2 | 1 (Padrão) |
| casa + sobrado_duplex ou sobrado_triplex | 1 | 33 (Sobrado) |
| casa + terrea ou outra | 1 | 5 (Padrão) |
| casa_condominio | 1 | 6 (Casa de Condomínio) — inalterado |
| terreno | 1003 | 8 |
| comercial | 1005 | 16 |
| rural | 1004 | 10 |

Sobre a verificação pedida nos catálogos salvos: em `docs/navent/subtipos-1.json` (Casa) existem Padrão (5), Casa de Condomínio (6), Casa de Vila (7), Sobrado (33) e Quarto (37). Ou seja, **Sobrado existe** e passa a ser usado; **Térrea não existe** e continua como Padrão (5).

Para casa em condomínio, o subtipo "Casa de Condomínio" (6) continua tendo prioridade sobre Sobrado, porque descreve melhor o produto e é o que o portal espera.

## Detalhes técnicos

- `FeedProperty` e `SELECT_COLUMNS` de `feed-opennavent.ts` ganham a coluna `category` (hoje não é lida por esse gerador).
- `NAVENT_TYPE_MAP` vira uma função `naventType(type, category)` com as regras acima; o fallback para tipo desconhecido segue Apartamento/Padrão (2/1).
- `docs/navent/README.md`: a tabela de de-para passa a incluir a coluna de categoria, com a nota de que Térrea não tem equivalente no catálogo e cai em Padrão (5).

## Não muda

`feed-zap.ts`, `property-export.ts`, formulário, banco e páginas públicas.

## Verificação

- `/feeds/wimoveis.xml` retorna 200 e bem formado; BB1000 com `<idSubTipo>26</idSubTipo>`; BB1001 e BB1002 com os valores atuais.
- `/feeds/zap.xml` byte a byte idêntico ao de hoje.
