# Conexão manual ao Supabase existente

## 1. Coletar credenciais (você fornece via formulário seguro)

Vou pedir 4 secrets, todos encontrados no dashboard Supabase em **Project Settings → API**:

- `SUPABASE_URL` — ex: `https://xxxxx.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` — a chave `anon` / `publishable`
- `SUPABASE_SERVICE_ROLE_KEY` — a chave `service_role` (secreta, só servidor)
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` — mesmas duas primeiras, mas prefixadas para o browser

## 2. Criar os 3 clients em `src/integrations/supabase/`

- **`client.ts`** — client do browser usando publishable key + persistência de sessão (auth/login no front).
- **`auth-middleware.ts`** — middleware `requireSupabaseAuth` para `createServerFn`, valida o bearer token do usuário e injeta `supabase` + `userId` no contexto.
- **`client.server.ts`** — client admin usando service role key, só para código server-only (bypassa RLS).
- **`auth-attacher.ts`** — middleware que anexa automaticamente o token de auth nas chamadas de server functions.

## 3. Registrar o auth attacher

Editar `src/start.ts` para incluir `attachSupabaseAuth` no `functionMiddleware` global do `createStart`.

## 4. Validar conexão

Criar uma server function de teste (`pingSupabase`) que faz um `SELECT 1` simples, chamar e confirmar que retorna OK.

## O que NÃO está incluso neste passo

- Criação de tabelas (`profiles`, `developments`, `properties`, etc.) — você roda os SQLs/migrations direto no dashboard Supabase
- Configuração de RLS policies — você faz no dashboard
- Setup de Auth providers (Google, etc.) — você habilita no dashboard
- Página de login `/admin` — passo separado depois que a conexão estiver de pé

## Limitações importantes (modo manual)

- As tools de schema/migrations/security do Lovable **não funcionam** com Supabase externo — só vejo o que você me contar sobre as tabelas
- Vou precisar que você cole o schema (ou rode `supabase gen types`) para eu gerar types TypeScript corretos
- Qualquer alteração de schema é responsabilidade sua no dashboard

## Detalhes técnicos

- Stack: TanStack Start v1 + Vite 7, rodando em Cloudflare Workers (edge)
- Padrão: `createServerFn` para lógica interna; server routes `/api/public/*` para webhooks
- Variáveis `VITE_*` ficam no bundle do browser; `SUPABASE_SERVICE_ROLE_KEY` é **server-only**, nunca importada em componentes
- Após confirmar o plano, eu disparo o formulário de secrets — você cola os valores e eu sigo com os arquivos
