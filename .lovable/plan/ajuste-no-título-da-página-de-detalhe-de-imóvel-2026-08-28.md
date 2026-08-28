# Ajuste no título da página de detalhe de imóvel

## Escopo
Apenas `src/routes/imoveis.$slug.tsx`. Nenhuma outra rota, componente ou helper será alterado.

## O que será feito

1. Reescrever a função `buildTitle(prop, slug)` para aplicar as novas regras de montagem do título:
   - Comparar o nome da região com o título do imóvel sem acentos e em minúsculas.
   - Se o nome da região já estiver contido no título, omitir o segmento ` | Região`.
   - Usar o sufixo ` | Bruno Barreto` (marca encurtada).
   - Limite de 65 caracteres.
   - Se o texto completo estourar o limite, descartar primeiro o segmento da região (quando ele existir e não for duplicado) e só depois truncar o título do imóvel.
   - Ao truncar o título, fazer o corte na última palavra inteira que couber, adicionando `…` sem cortar palavras.

2. Garantir que `head()` continue usando `buildTitle` para `<title>` e para `og:title` / `twitter:title`, mantendo descrição, canonical, OG/Twitter image e alt intactos.

3. Verificar o build com `bun run build:dev` e conferir via `curl` o HTML de um imóvel real para confirmar que o título respeita as regras.

## Resultado esperado
Títulos como `"Casa Jardim Botânico 3 quartos + escritório | Bruno Barreto"` em vez de `"Casa Jardim Botân… | Jardim Botânico | Bruno Barreto Imóveis"`.
