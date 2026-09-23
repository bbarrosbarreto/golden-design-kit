# Etapa 2D — Feed XML próprio do DF Imóveis

O DF Imóveis usa layout proprietário (Integração via XML, Layout do Arquivo v1.1), não o padrão ZAP. Ganha gerador e rota próprios; `/feeds/zap.xml` e `/feeds/wimoveis.xml` ficam intactos.

## Arquivos

- Novo `src/lib/feed-dfimoveis.ts` — gerador dedicado, usando os helpers de `feed-common.ts` (`fetchEligible`, `orderedImages`, `passesReadiness`, `escapeXml`, `cdata`, `tag`, `tagOptional`, `intOrNull`).
- Nova rota `src/routes/feeds.dfimoveis[.]xml.ts` → `/feeds/dfimoveis.xml`, casca fina no mesmo molde das outras (`Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=900`).
- Nenhuma alteração em `feed-zap.ts`, `feed-opennavent.ts`, `PropertyForm`, páginas públicas ou banco.

## Elegibilidade

Idêntica ao feed ZAP, filtrando `export_portals` por `dfimoveis`: ativo, disponível, exportação ligada, os 8 itens do painel de prontidão (incluindo descrição de 50 a 3000 caracteres, mantida apesar de a documentação permitir 5000) e ao menos uma área preenchida.

## Estrutura do XML

```text
<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Imoveis>
    <Imovel> ... </Imovel>
  </Imoveis>
</Carga>
```

Campos por `<Imovel>`, exatamente estes nomes:

CodigoImovel (listing_code, até 10 caracteres), TipoImovel, SubTipoImovel, Creci = 34060, Uf, Cidade, Bairro (CDATA), CEP (8 dígitos), Endereco, Complemento, ExibirComplemento = 0, PrecoVenda, PrecoLocacao, PrecoCondominio, PrecoIptu, AreaUtil (`useful_area` ou `built_area`), AreaTotal, AreaDoTerreno (só para terreno e rural), UnidadeMetrica = M2, QtdDormitorios, QtdSuites, QtdBanheiros, QtdVagas, QtdSalas, AnoConstrucao (4 dígitos), Observacao (CDATA), AceitaFinanciamento = 1, Fotos.

Preço: `purpose = 'aluguel'` → PrecoLocacao = `price`; caso contrário PrecoVenda = `price` e, se `rent_price` > 0, também PrecoLocacao. Valores monetários e áreas saem inteiros, sem símbolo nem separador.

AreaTotal é obrigatória neste layout: quando `area` for nula, emite o mesmo valor de AreaUtil (`useful_area`, ou `built_area` se útil for nula). Sem nenhuma área o imóvel não passa na elegibilidade. Esse fallback vale só para o DF Imóveis — ZAP e Wimóveis seguem omitindo AreaTotal quando nula.

Fotos: um `<Foto>` por imagem, na mesma ordem exibida no site (capa primeiro), cada um com `<NomeArquivo>` (rótulo da categoria da imagem) e `<URLArquivo>` (URL pública).

Não são emitidos: CategoriaImovel, TipoOferta, Principal, Numero, Latitude, Longitude, Videos, nem qualquer booleano de característica (ArCondicionado, Piscina, Varanda e afins) — o banco não tem esses dados e o layout aceita omissão.

Tag vazia nunca é emitida: valor nulo ou string vazia omite a tag inteira. Exceções fixas sempre presentes: Creci, ExibirComplemento, UnidadeMetrica, AceitaFinanciamento.

## Tabela de tipos (anexo 01 da documentação)

| nosso type + category | TipoImovel | SubTipoImovel |
| --- | --- | --- |
| apartamento (padrao) | Apartamento | Padrao |
| apartamento (cobertura*) | Apartamento | Cobertura |
| cobertura | Apartamento | Cobertura |
| casa (terrea ou padrao) | Casa | Térrea |
| casa (sobrado_duplex/triplex) | Casa | Sobrado |
| casa_condominio | Casa | Condomínio |
| terreno | Lote | Lote Residencial |
| comercial | Sala | Sala |
| rural | Rural | Chácara-Sítio |

Tipo desconhecido cai em Apartamento / Padrao. Os demais subtipos do anexo ficam registrados em comentário no gerador, para uso futuro.

## Verificação

`bun run build:dev`, requisição local a `/feeds/dfimoveis.xml` conferindo 200, XML bem formado e os 5 imóveis, `ExibirComplemento` em todos, a chácara como Rural / Chácara-Sítio e o terreno como Lote / Lote Residencial. Conferência de que `/feeds/zap.xml` e `/feeds/wimoveis.xml` continuam idênticos.
