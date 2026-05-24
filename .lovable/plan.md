## Correções no PropertyForm

### Bug 1 — Campos de área por tipo

Reescrever o bloco de campos de área com renderização condicional por `type`:

**Apartamento** — somente:
- `useful_area` com label **"Área (m²)"**

**Casa** — quatro campos:
- `area` → **"Área Total do Terreno (m²)"**
- `built_area` → **"Área Construída (m²)"**
- `useful_area` → **"Área Útil (m²)"**
- `green_area` → **"Área Verde (m²)"**

**Terreno** — três campos:
- `area` → **"Área Total (m²)"**
- `useful_area` → **"Área Útil/Construível (m²)"**
- `green_area` → **"Área Verde (m²)"**

Atualizar `toPayload` para zerar (null) os campos não exibidos conforme o tipo, garantindo que valores antigos não persistam ao trocar o tipo do imóvel.

### Bug 2 — Submit silencioso

Diagnóstico provável: o formulário usa `register("title", { required: true })` mas nunca renderiza mensagens de erro, então quando algum campo obrigatório falha o `handleSubmit` bloqueia silenciosamente. Além disso, `slug` é gerado em `useEffect` e pode não estar pronto quando o usuário clica rapidamente em "Criar".

Correções:

1. **Mensagens de erro visíveis**: registrar `title` com `{ required: "Título é obrigatório" }` e renderizar `formState.errors.title?.message` em um `<p className="text-sm text-destructive">` abaixo do campo. Mesmo padrão se for necessário marcar outro campo obrigatório.

2. **Slug garantido no submit**: dentro do `handleSubmit`, antes de chamar `mutation.mutate`, recalcular `values.slug = values.slug?.trim() || slugify(values.title)`. Remove a dependência da ordem de execução do `useEffect`.

3. **Onsubmit invalid handler**: passar o segundo argumento ao `handleSubmit((valid) => …, (errors) => { console.warn("form invalid", errors); toast.error("Verifique os campos obrigatórios"); })` para que o usuário receba feedback mesmo se a validação falhar.

4. **Erros do Supabase com detalhe**: no `onError` da mutação, exibir `toast.error(e.message || "Erro ao salvar imóvel")` e logar `console.error(e)` para diagnóstico. Já existe `toast.error`, garantir que a mensagem do PostgrestError seja propagada (usar `error.message` retornado pelo Supabase no `mutationFn`).

5. **Loading state**: o botão já usa `mutation.isPending`; garantir `disabled={mutation.isPending}` e manter o spinner. Adicionar texto "Salvando…" enquanto `isPending`.

### Arquivo afetado

- `src/components/admin/PropertyForm.tsx` (único arquivo modificado)

Nenhuma alteração em rotas, schema do banco, ImageUploader ou AdminLayout.