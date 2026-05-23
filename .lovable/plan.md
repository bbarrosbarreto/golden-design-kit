## Bugs a corrigir em `/admin/empreendimentos`

Escopo: apenas `src/components/admin/DevelopmentForm.tsx` e `src/components/admin/ImageUploader.tsx`. Nada mais é alterado.

### Bug 1 — Select de regiões vazio

Em `DevelopmentForm.tsx`, a query atual seleciona todas as regiões ordenadas por `name`, sem filtrar `active` e sem usar `display_order`.

Mudanças:
- Trocar a query para:
  `supabase.from('regions').select('id, name').eq('active', true).order('display_order')`
- Manter a mesma `queryKey` (`['regions']`) e o mesmo mapeamento `regionsQuery.data?.map(...)` para `<SelectItem>` (já correto).
- Adicionar um `console.error` caso a query retorne erro, para diagnóstico futuro.

### Bug 2 — Upload de imagem falhando

Em `ImageUploader.tsx`:

1. **Gate de sessão**: antes de iniciar o upload, chamar `supabase.auth.getSession()` e abortar com toast de erro ("Sessão expirada, faça login novamente") se não houver sessão. Isso evita upload anônimo quando o token ainda não foi restaurado.
2. **Path do arquivo**: trocar `${crypto.randomUUID()}.${ext}` por `${crypto.randomUUID()}-${file.name}` conforme solicitado, e usar `{ upsert: true }` no upload.
3. **URL pública**: usar `data.path` retornado pelo `upload()` em `getPublicUrl(data.path)` ao invés do `path` calculado localmente.
4. **Diagnóstico**: adicionar `console.error("[ImageUploader] upload failed", error)` quando o upload falhar, mantendo o toast existente.

Comportamento da UI (botão, grid de thumbs, remover) permanece idêntico.

### Fora de escopo

- Bucket `developments` no Storage (assumido já existente).
- RLS de `storage.objects` (assumido permitindo upload para `authenticated`).
- Qualquer outro componente, rota ou query.
