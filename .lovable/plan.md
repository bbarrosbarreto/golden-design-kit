# Formulário de imóveis: mostrar o motivo quando o save é bloqueado

## Problema
Quando "Exportar para portais" está ligado e falta um campo obrigatório, o save para. O erro fica marcado só no campo, que pode estar fora da tela. Além disso, o painel de prontidão (8 itens) e a validação do save (até 13 itens) usam regras diferentes.

## O que muda para o usuário
1. **Resumo no topo do formulário**: quando o save é bloqueado, aparece uma caixa em destaque (tom de erro) no início do formulário: "Não foi possível salvar. Faltam: Banheiros, CEP." Cada nome é clicável e leva até o campo, com foco nele.
2. **Rolagem automática**: o formulário rola até o primeiro campo com erro, na ordem em que os campos aparecem na tela, e coloca o foco nele.
3. **Toast mantido**: continua aparecendo, mas agora junto com o resumo, que fica visível até o problema ser corrigido. Ao corrigir um campo, ele sai do resumo. Quando a lista fica vazia, o resumo some.
4. **Painel de prontidão = validação do save**: o painel passa a mostrar exatamente a mesma lista usada para bloquear o save: Título, Descrição, Logradouro, Bairro, CEP, Cidade, Estado, área, preço, 5 imagens, quartos e banheiros (só para tipos residenciais) e ao menos um portal. Se o painel estiver todo verde, o save passa.

## Uma divergência que vai ser resolvida
Hoje o painel aceita "preço de venda **ou** valor de aluguel", mas o save exige o campo **Preço**. Na lista única, a regra vai ser a do save: **Preço maior que zero** é obrigatório. É a regra mais segura, porque o feed usa o preço principal. Se preferir a regra do painel, é só avisar.

## Detalhes técnicos
- `src/lib/property-export.ts`: nova função `evaluateFormReadiness(values)` que devolve itens `{ field, label, ok, reason }`, com a ordem de exibição e o campo ligado a cada item (`field` usado para rolar e focar). `evaluateReadiness`/`isReady` **não mudam**, porque `feed-common.ts` depende delas e os feeds ficam fora desta mudança.
- `PropertyForm.tsx`:
  - `validateForExport` passa a ser derivada de `evaluateFormReadiness` (fonte única). O painel e a regra de "exportar só se estiver pronto" (`ready`, `toPayload`, desligar o switch) usam a mesma lista.
  - A validação de exportação sai de dentro do `mutationFn` e vai para o handler de submit, antes da mutação. Assim dá para aplicar `setError`, guardar a lista em estado (`blockedFields`) e rolar até o campo sem passar pelo caminho de erro de rede.
  - Rolagem e foco: `document.getElementById(field)?.scrollIntoView({ behavior: "smooth", block: "center" })` + `focus({ preventScroll: true })`. Para "imagens" e "área", há um id âncora no bloco correspondente (a área usa o primeiro input de área visível para o tipo).
  - `onInvalid` (erros do react-hook-form, como título vazio) usa o mesmo resumo e a mesma rolagem.
  - O resumo é recalculado a partir dos valores em tempo real, filtrado pelos campos que bloquearam o save.
  - O resumo usa os tokens `destructive` já existentes, sem cores fixas no código.

## Não mexer
Feeds XML (`feed-*.ts`, `evaluateReadiness`), banco de dados, upload de imagens.
