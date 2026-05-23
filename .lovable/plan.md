## Objetivo

Confirmar que o client do Supabase inicializa com as Build Secrets agora configuradas (`VITE_MY_SUPABASE_URL` e `VITE_MY_SUPABASE_ANON_KEY`) e que as tabelas do PRD respondem via RLS pública.

## Passos

1. **Verificar boot do client no browser**
   - Recarregar a preview em `/`.
   - Conferir console: não pode mais aparecer o erro "Supabase env vars missing".

2. **Criar server function de healthcheck** (`src/lib/health.functions.ts`)
   - `checkSupabase` usando `createServerFn` + client autenticado público.
   - Faz `select count` em 3 tabelas-chave: `developments`, `properties`, `site_settings`.
   - Retorna `{ ok, tables: { developments, properties, site_settings }, error? }`.

3. **Invocar via `stack_modern--invoke-server-function`**
   - Chamar `/api/health` (ou via RPC do serverFn) e validar resposta.
   - Se falhar, ler `server-function-logs` pra diagnosticar (env vars no runtime, RLS, etc).

4. **Teste client-side rápido**
   - Pequeno query no browser (já existente em algum componente ou via console) pra garantir que a leitura pública das tabelas funciona pelo anon key.

5. **Relatório**
   - Confirmar para você o que respondeu OK e o que não respondeu, sem mexer em UI/funcionalidade.

## Detalhes técnicos

- Não altero o `client.ts` — ele já tem fallback `VITE_*` → `process.env.*`.
- O serverFn lê `process.env.MY_SUPABASE_URL` / `MY_SUPABASE_ANON_KEY` no `.handler()` (nunca em escopo de módulo).
- Nenhuma mudança em rotas, layout ou componentes existentes.

## Fora de escopo

- Criar páginas, CRUD admin, ou popular dados.
- Mexer em RLS (você confirmou que já está pronta).
