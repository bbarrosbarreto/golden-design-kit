# Diagnóstico da tela branca + ajuste no guarda do email placeholder

## Diagnóstico (na ordem pedida)

**1. routeTree.gen.ts — OK.** Foi regenerado corretamente: existem duas rotas irmãs planas, `/feeds/zap.xml` (linha 84-85) e `/feeds/wimoveis.xml` (linha 89-90), ambas com `id` = `path` = `fullPath`. Não existe segmento pai `feeds` implícito porque o ponto escapado (`[.]`) torna cada arquivo um segmento único — mesmo padrão do `sitemap[.]xml.ts`, que nunca precisou de layout. Sem entradas duplicadas ou órfãs.

**2. Imports em tempo de módulo — OK.** `property-export.ts` não importa nada local (zero imports), então não há ciclo `property-export → feed-common → property-export`. `feed-common.ts` e `feed-opennavent.ts` só são importados por `feed-zap.ts` e pela rota de servidor — todos arquivos server-only, nada vaza para o bundle do cliente.

**3. Erro real — encontrado.** O dev server não tem nenhum erro no log. Todas as páginas respondem 200 (`/`, `/empreendimentos`, `/feeds/zap.xml`). O único 500 é `/feeds/wimoveis.xml`, com a mensagem:

```
feed-opennavent: NAVENT_CONTACT_EMAIL ainda é o placeholder. Troque pelo email real em src/lib/feed-opennavent.ts antes de publicar o feed.
```

Ou seja: **o "erro de runtime" reportado é o próprio guarda do email placeholder que implementamos de propósito**. Não é falha de inicialização do app — o preview do Lovable trata qualquer 500 como crash e exibiu a tela de erro. (O aviso de hydration no console é da extensão Grammarly do navegador — `data-new-gr-c-s-check-loaded` — não é nosso.)

## Correção proposta

O guarda atual joga 500 mesmo com o feed vazio, o que faz o preview marcar o app como quebrado. Ajuste em `src/lib/feed-opennavent.ts` (e simplificação da rota):

1. O throw passa a acontecer **somente quando há ao menos um imóvel elegível para o Wimóveis** — ou seja, anúncios reais jamais saem com email placeholder.
2. Com zero elegíveis (situação de hoje), a rota responde **200 com o feed vazio bem formado** (`<OpenNavent>` + `dataModificacao` + `<Imoveis></Imoveis>`), mais um comentário XML `<!-- ... -->` lembrando da troca do email.
3. A rota `feeds.wimoveis[.]xml.ts` mantém o try/catch: se o throw disparar (feed com imóveis + placeholder), responde 500 com a mensagem clara — comportamento aprovado preservado onde importa.

## Verificação

- `GET /feeds/wimoveis.xml` → 200, XML bem formado, `dataModificacao` com 13 dígitos, comentário de aviso presente
- `GET /feeds/zap.xml` → byte a byte idêntico a `/tmp/zap-before.xml`
- `/` e `/empreendimentos` → 200
- Runtime error do preview desaparece

## Não mexer

- Árvore de rotas (está correta)
- feed-zap.ts, feed-common.ts, páginas públicas, banco
