# Plano — Página Admin de Leads

## Arquivos

1. **`src/routes/admin/leads.tsx`** (novo)
2. **`src/components/admin/AdminLayout.tsx`** (ajuste pontual: corrigir `to` do item "Leads")

Nenhum outro arquivo será alterado. `routeTree.gen.ts` é regenerado automaticamente.

---

## 1. `src/routes/admin/leads.tsx`

### Rota
```ts
export const Route = createFileRoute("/admin/leads")({
  component: LeadsAdminPage,
});
```

### Query
```ts
useQuery({
  queryKey: ["admin", "leads"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*, developments(title), properties(title)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as LeadRow[];
  },
});
```

Tipo `LeadRow`: `{ id, created_at, name, phone, message, source, status, development_id, property_id, developments: {title}|null, properties: {title}|null }`.

### Cabeçalho
- `<h1>Leads</h1>` + contador "`{data.length} leads`" (font-heading + text-muted-foreground).
- Linha de filtros (flex gap-3):
  - Select origem: Todos | empreendimento | imovel | contato
  - Select status: Todos | novo | contactado | convertido | descartado
  - Input de busca (ícone `Search`) — filtra `name` ou `phone` (case-insensitive, ignora não-dígitos no phone).
- Filtragem 100% client-side via `useMemo` sobre `data`.

### Tabela (componentes shadcn `Table`)
Colunas: **Data | Nome | WhatsApp | Origem | Mensagem | Status | Ações**

- **Data**: `new Date(created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })`.
- **WhatsApp**: `<a href={`https://wa.me/55${onlyDigits(phone)}`} target="_blank">` com ícone, formatado `(61) 99935-0888`.
- **Origem** — `<Badge>` com classe condicional:
  - `empreendimento` → `bg-primary text-primary-foreground` + nome de `developments.title`
  - `imovel` → `bg-badge-blue text-white` + `properties.title`
  - `contato` → `bg-muted text-muted-foreground` + "Contato Geral"
- **Mensagem**: `truncate max-w-[240px]` + `<Tooltip>` (TooltipProvider no topo da página) mostrando texto completo.
- **Status**: `<Select>` inline controlado, `onValueChange` dispara mutation:
  ```ts
  updateStatusMutation.mutate({ id, status })
  ```
  Mutation: `supabase.from("leads").update({ status }).eq("id", id)`. `onSuccess` → `toast.success("Status atualizado")` + `invalidateQueries(["admin","leads"])`. Cor do trigger via `statusBadgeClass(status)`:
  - novo → cinza (`bg-muted`)
  - contactado → azul (`bg-badge-blue text-white`)
  - convertido → verde (`bg-badge-green text-white`)
  - descartado → `bg-destructive/15 text-destructive`
- **Ações**: dois `Button` ghost/icon:
  - 💬 (`MessageCircle`) → abre `wa.me/55+phone` em nova aba
  - 🗑️ (`Trash2`) → `setDeleting(lead)` → abre `AlertDialog`

### Exclusão
```ts
deleteMutation: supabase.from("leads").delete().eq("id", id)
onSuccess → toast + invalidateQueries(["admin","leads"]) + setDeleting(null)
```
`AlertDialog` com título "Excluir lead?", descrição com nome do lead, botões Cancelar / Excluir.

### Estados
- Loading: skeleton de 5 linhas (ou texto "Carregando…" seguindo padrão de empreendimentos).
- Vazio (sem dados ou após filtros): linha única "Nenhum lead encontrado".

### Visual
- `AdminLayout` como wrapper raiz.
- Tipografia/cores apenas via tokens semânticos (`font-heading`, `font-body`, `bg-primary`, `bg-badge-green`, `bg-badge-blue`, `bg-muted`, `text-muted-foreground`, `border-border`).
- Sem paginação (conforme pedido).

---

## 2. `src/components/admin/AdminLayout.tsx`

Hoje o item "Leads" aponta para `/admin`. Trocar para `/admin/leads` e usar ícone `MessageSquare` (mais semântico para mensagens) — substituindo apenas a entrada correspondente no array `NAV`.

```ts
{ label: "Leads", icon: MessageSquare, to: "/admin/leads" },
```

Atualizar import de `lucide-react` adicionando `MessageSquare` e removendo `Users` se não restar uso.

---

## Helpers internos ao arquivo
- `onlyDigits(s: string)` → `s.replace(/\D/g, "")`
- `formatPhone(s)` → exibição "(DD) NNNNN-NNNN"
- `statusBadgeClass(status)` e `sourceBadge(lead)` → mapas de classes/labels.

## Validação pós-implementação
- Build TS deve passar (sem mexer em `routeTree.gen.ts`).
- Abrir `/admin/leads`: lista carrega, filtros funcionam, mudar status persiste, excluir remove a linha, botão WhatsApp abre `wa.me`.
