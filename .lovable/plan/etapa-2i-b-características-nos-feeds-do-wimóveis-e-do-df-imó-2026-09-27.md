# Etapa 2I-B: características nos feeds do Wimóveis e do DF Imóveis

A mudança só acrescenta. Um imóvel sem características marcadas sai exatamente como hoje, e o ZAP não muda.

## O que o catálogo confirma
- Os 30 ids Navent da lista existem no catálogo, todos do tipo Checkbox com os valores 1 (True) e 0 (False).
- Alguns ids aparecem só no catálogo de um tipo. Exemplo: Churrasqueira (10048) e Elevador (10071) estão só no de Apartamento.

## Parte 1: Wimóveis (`feed-opennavent.ts`)
- A busca do feed passa a ler também a coluna `features`.
- Os nomes vêm dos arquivos `docs/navent/caracteristicas-{idTipo}.json`, carregados quando o código é montado, e nunca são escritos à mão. A busca usa o catálogo do tipo Navent do próprio imóvel (1, 2, 1003, 1004 ou 1005).
- Para cada característica marcada que tenha código Navent, o feed emite um item no fim do bloco `<caracteristicas>`, depois do complemento, na ordem da lista central:

```text
<caracteristica>
  <id>10140</id>
  <nome><![CDATA[AREAS_COMUNS|PISCINA]]></nome>
  <idValor>1</idValor>
</caracteristica>
```

- O valor enviado é o código 1, como você decidiu. Nada é enviado com 0.
- Se o id não existir no catálogo daquele tipo, a característica não é enviada e aparece um aviso no console, uma vez por id e tipo.
- Um imóvel que hoje não tem bloco `<caracteristicas>` passa a ter um se tiver alguma característica marcada.

## Parte 2: DF Imóveis (`feed-dfimoveis.ts`)
- A busca do feed passa a ler também a coluna `features`.
- Para cada característica marcada que tenha tag do DF Imóveis, o feed emite `<Tag>1</Tag>` depois de `<AceitaFinanciamento>` e antes de `<Fotos>`.
- As tags repetidas são removidas: Piscina e Churrasqueira saem uma única vez, mesmo com a versão do condomínio e a privativa marcadas. A ordem segue a primeira ocorrência na lista central.
- Uma chave desconhecida, ou que não seja texto, é ignorada.

## Não será tocado
`feed-zap.ts`, `feed-common.ts`, o banco, o formulário, `property-features.ts`, as tags atuais e a ordem delas, CON1, a localidade, a data de modificação, as fotos e o CodigoCliente.

## Verificação
- Typecheck e build.
- Os três XMLs antes e depois da mudança, byte a byte, sem contar a data de geração. Hoje devem sair idênticos se nenhum imóvel tiver características marcadas.
- Um teste com dados simulados de um imóvel que tenha piscina do condomínio e privativa, churrasqueira e elevador marcados, para conferir: nomes vindos do catálogo, idValor 1, Piscina uma vez só no DF, a posição das tags e o aviso para id ausente no catálogo do tipo.
