Polimento em `buildTitle` — remover pontuação solta antes de "…"

## Contexto
Em `src/routes/imoveis.$slug.tsx` a função `buildTitle` trunca o título do imóvel quando ele ultrapassa 65 caracteres. O truncamento por palavra inteira pode deixar caracteres de pontuação soltos no final (ex.: `"3 quartos +…"`), o que fica visualmente estranho.

## Objetivo
Ajustar `buildTitle` para que, após o truncamento, qualquer sequência final de `+ - , ; : / &` e espaços seja removida antes de acrescentar `…`. O exemplo `"3 quartos +…"` deve ficar `"3 quartos…"`.

## Escopo do ajuste
- Arquivo: `src/routes/imoveis.$slug.tsx`
- Apenas a função `buildTitle` (linhas 93–114)
- Nenhuma outra função, metadado, layout ou comportamento será alterado

## Implementação
1. Criar uma pequena função auxiliar local (ou inline) que aplique `.replace(/[\s+\-,:/&]+$/g, "")` no texto truncado.
2. Aplicar essa limpeza no `truncated` logo após o corte na última palavra inteira e antes de concatenar `…`.
3. Manter a lógica atual de:
   - Omitir região se já estiver no título
   - Usar suffixo `" | Bruno Barreto"`
   - Limite de 65 caracteres
   - Remover região primeiro se estourar o limite
   - Truncar título só depois
   - Corte na última palavra inteira

## Exemplo de comportamento
Antes: `Casa Jardim Botânico escriturada 3 quartos + | Bruno Barreto` → `Casa Jardim Botânico escriturada 3 quartos +… | Bruno Barreto`
Depois: `Casa Jardim Botânico escriturada 3 quartos +… | Bruno Barreto` → `Casa Jardim Botânico escriturada 3 quartos… | Bruno Barreto`
