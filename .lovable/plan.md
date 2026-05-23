## Objetivo
Fazer o login do painel Admin funcionar com o seu Supabase externo, removendo a suposição de Lovable Cloud.

## Plano
1. Unificar a configuração do Supabase para aceitar os nomes de variáveis corretos do projeto e também os nomes padrão do template.
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/auth-middleware.ts`
   - `src/integrations/supabase/client.server.ts`
   - `src/lib/health.functions.ts`

2. Ajustar o cliente do browser para não cair no fallback `http://localhost` quando as variáveis do seu Supabase não estiverem expostas corretamente no frontend.
   - Priorizar leitura de `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Manter fallback para `VITE_MY_SUPABASE_URL` / `VITE_MY_SUPABASE_ANON_KEY`
   - No servidor, suportar também `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` com fallback para `MY_*`

3. Melhorar a tela de login para mostrar erro real de configuração/rede quando não for credencial inválida.
   - Se a autenticação retornar erro de credenciais, manter mensagem amigável
   - Se faltar URL/chave ou houver falha de conexão, mostrar mensagem específica para não parecer “senha incorreta”

4. Validar o fluxo do Admin sem SSR direto para auth.
   - `/admin/login` autentica no client
   - `/admin` continua protegido por `AdminGuard`
   - logout continua redirecionando para `/admin/login`

## Detalhes técnicos
Hoje o código está lendo apenas `MY_SUPABASE_*` em vários pontos. Isso funciona só se essas variáveis existirem exatamente com esses nomes no lugar certo. No browser, o arquivo `src/integrations/supabase/client.ts` também faz fallback para `http://localhost`, o que mascara o problema e faz o login parecer erro de senha.

Vou corrigir isso deixando a integração compatível com:
- seu Supabase externo
- variáveis `MY_*` já usadas no projeto
- variáveis padrão `SUPABASE_*` / `VITE_SUPABASE_*`

## Resultado esperado
- login do admin passa a autenticar no seu projeto Supabase real
- erro de configuração não aparece mais como “senha incorreta”
- nenhuma dependência de Lovable Cloud é introduzida