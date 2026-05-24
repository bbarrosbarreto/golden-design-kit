# Garantir insert de imóveis e erro real no toast

## Contexto
A coluna `address` já existe no banco. O formulário já está enviando o payload corretamente, mas o erro do Supabase precisa ser mostrado por completo (mensagem + details + hint + code) para diagnosticar qualquer outro campo rejeitado pelo PostgREST.

## Mudanças

Apenas em `src/components/admin/PropertyForm.tsx`:

1. **Propagar o erro completo do Supabase no `mutationFn`**
   Em vez de `throw new Error(error.message)`, montar uma mensagem que inclua `message`, `details`, `hint` e `code` retornados pelo PostgREST. Assim, se ainda houver outra coluna ausente, o toast mostra exatamente qual.

2. **Toast com a mensagem completa**
   `onError` continua igual, mas agora recebe a string composta acima. Mantém o `console.error` com o objeto bruto para depuração.

3. **Sem outras mudanças**
   Mantém slug, campos por tipo, conversão de UUID/numéricos, loading state e validação já existentes.

## Resultado esperado
- Criar imóvel funciona normalmente agora que `address` existe no schema.
- Se houver qualquer outro campo rejeitado, o toast exibe a mensagem real (ex.: `Could not find the 'X' column…`) em vez de um erro genérico.