# Etapa 2H: condomínio, IPTU e complemento no feed do Wimóveis

## O que foi conferido antes

- **Catálogo salvo (docs/navent/caracteristicas-*.json):** os três códigos existem nos 5 tipos (Casa, Apartamento, Terreno, Rural, Comercial), com os nomes exatos pedidos:
  - CFT6 = PRINCIPALES|CONDOMINIO (campo numérico aberto)
  - CFT400 = PRINCIPALES|IPTU (campo numérico aberto)
  - 2000199 = GENERALES|COMPLEMENTO (campo aberto, texto)
- **Coordenadas:** o feed já envia hoje `<latitude>` e `<longitude>` dentro de `<localizacao>` (desde a Etapa 2B, só quando preenchidas e dentro da faixa válida). Porém **não consegui confirmar esses nomes na documentação oficial** — o site da API só lista os endpoints, não o layout do XML. Por isso, seguindo a sua regra, **não mexo nas coordenadas**: não adiciono nada e não altero o que já existe. Se quiser, peça o layout oficial à área técnica do Wimóveis para confirmarmos (ou para retirarmos, caso estejam erradas).

## O que muda (só src/lib/feed-opennavent.ts)

1. Incluir `condo_fee`, `iptu` e `complement` na busca e no tipo do imóvel do feed (latitude e longitude já são buscadas).
2. Dentro de `<caracteristicas>`, no mesmo formato de CFT2/CFT3/CFT4/CFT7 (`<id>`, `<nome>`, `<valor>`):
   - CFT6 com o valor de condomínio, só se maior que zero
   - CFT400 com o valor de IPTU, só se maior que zero
   - valores inteiros, como as demais características numéricas
3. Característica 2000199 com o complemento, só se preenchido (após tirar espaços). Vai em `<valor>`, dentro de CDATA para não quebrar o XML com caracteres como "&". Emojis e caracteres invisíveis são removidos do texto; se sobrar vazio, a característica não sai. O complemento **não** entra no endereço.
4. Novas características entram depois das atuais, sem mudar a ordem de nada que já sai hoje.

## Não muda

feed-dfimoveis.ts, feed-zap.ts, feed-common.ts, banco, formulário, CON1, `<localidade>`, `<endereco>`, coordenadas.

## Verificação

- /feeds/wimoveis.xml retorna 200 e XML bem formado.
- Imóvel com condomínio e IPTU traz CFT6 e CFT400; imóvel com complemento traz 2000199.
- Imóveis sem esses dados saem idênticos ao XML de hoje (comparação antes/depois, ignorando só a data de modificação).
- /feeds/zap.xml e /feeds/dfimoveis.xml byte a byte iguais aos atuais.
