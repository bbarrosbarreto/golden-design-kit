# Etapa 2I-A: lista central de características e seção no formulário

## O que existe hoje (verificado)
- O formulário de imóveis não lê nem grava `features`.
- O componente de caixa de seleção (Checkbox) já existe no projeto.
- A página pública do imóvel não mostra características na tela. O único uso é nos dados estruturados para o Google (JSON-LD, em `property-schema.ts`), que hoje publicam o texto cru de cada item.

## 1. Novo `src/lib/property-features.ts`
- Constante `PROPERTY_FEATURES` com os 43 itens exatamente como no pedido (`key`, `label`, `group` "comuns" | "privativa", `df`, `navent` como número ou null).
- 17 itens "comuns" e 26 "privativa", na ordem da lista.
- `featureLabel(key)` retorna o rótulo; para chave desconhecida, retorna a própria chave.

## 2. `PropertyForm.tsx`
- Novo campo `features: string[]` no formulário: padrão `[]`, carregado do anúncio (só strings) e incluído no que é salvo.
- Nova seção "Características" no mesmo estilo de caixa das outras seções, posicionada depois de Endereço e antes de Exportação para portais.
- Duas subseções com título: "Áreas comuns do condomínio" e "Área privativa da unidade".
- Caixas de seleção em grade: 1 coluna no celular, 2 no tablet, 3 no desktop.
- As caixas salvas continuam marcadas ao reabrir o anúncio. Nenhum item é obrigatório, e a validação e o painel de prontidão não mudam.

## 3. Site público
- A tela não mostra características, então nada novo é criado.
- Ponto para você decidir: os dados para o Google passariam a publicar keys como "piscina_condominio". Proponho usar `featureLabel` também ali, para publicar "Piscina (condomínio)". É uma linha em `property-schema.ts`. Se preferir não mexer, esse item sai do plano.

## Não tocar
Feeds (`feed-*.ts`, `routes/feeds.*`), banco, `evaluateFormReadiness` e as demais seções do formulário.

## Verificação
- Typecheck e build.
- Comparar os três XMLs antes e depois, que devem ficar byte a byte idênticos.
- Marcar caixas, salvar, reabrir e confirmar que continuam marcadas.
