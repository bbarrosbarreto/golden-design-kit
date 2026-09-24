# Etapa 2F — Ajustes pedidos pelo Grupo QuintoAndar no feed Wimóveis

## O que os catálogos confirmam

CON1 existe nos 5 catálogos (`docs/navent/caracteristicas-*.json`) com o mesmo formato:

- `nombre`: `MEDIDAS|UNIDAD_DE_MEDIDA`
- tipo `Select`, valores admitidos: `HA` (Hectáreas) e `M2` (Metro Cuadrado)

Logo usa `<idValor>M2</idValor>`, como no exemplo deles.

Todas as características que já emitimos (CFT2, CFT3, CFT4, CFT5, CFT7, CFT100, CFT101) têm `nombre` oficial no catálogo. Para ficar igual ao exemplo do QuintoAndar, cada uma passa a levar também `<nome>` com o nome exato do catálogo.

## 1. Característica CON1

- Emitida em todo imóvel que tenha CFT100 ou CFT101 no bloco.
- Formato:

```text
<caracteristica>
  <id>CON1</id>
  <nome>MEDIDAS|UNIDAD_DE_MEDIDA</nome>
  <idValor>M2</idValor>
</caracteristica>
```

- As numéricas passam a sair como `<id>`, `<nome>`, `<valor>`:
  - CFT2 `PRINCIPALES|QUARTO`, CFT3 `PRINCIPALES|BANHEIRO`, CFT4 `PRINCIPALES|SUITE`, CFT7 `PRINCIPALES|VAGA`, CFT100 `MEDIDAS|AREA_TOTAL`, CFT101 `MEDIDAS|AREA_UTIL`, CFT5 `PRINCIPALES|IDADE_DO_IMOVEL`.

## 2. Estado por extenso na localidade

- Mapa com as 27 UFs (AC Acre … TO Tocantins, DF Distrito Federal) em `feed-opennavent.ts`.
- Usado só na montagem de `<localidade>`: `Noroeste,Brasília,Distrito Federal,Brasil`, sem espaços após as vírgulas.
- Sigla em maiúsculas/sem espaços antes da busca; sigla desconhecida sai como está.

## Detalhes técnicos

- `NAVENT_FEATURES` vira `{ id, nome }`; `buildCaracteristicas` ganha helper para `idValor`; CON1 é adicionado depois das áreas, se alguma foi emitida.
- `docs/navent/README.md`: registrar CON1 (Select, M2) e a regra do estado por extenso.
- `roadmap.md`: Etapa 2F concluída.

## Não será tocado

Banco, PropertyForm, `feed-zap.ts`, `feed-dfimoveis.ts`.

## Verificação

- `/feeds/wimoveis.xml` 200, bem formado, CON1/M2 em todo imóvel com área, `<nome>` em todas as características.
- Localidade com "Distrito Federal".
- `/feeds/zap.xml` e `/feeds/dfimoveis.xml` byte a byte idênticos (comparação antes/depois).
