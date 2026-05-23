## Objetivo
Corrigir `src/integrations/supabase/client.ts` para usar diretamente a URL e a anon key públicas do seu projeto Supabase externo, sem depender de variáveis de ambiente nem fallback para `localhost`, e então validar o fluxo em `/admin/login`.

## Alterações
1. Atualizar `src/integrations/supabase/client.ts`
   - remover leitura de `import.meta.env` e `process.env`
   - definir constantes fixas:
     - `SUPABASE_URL = "https://acteyqbhonzqtnujstao.supabase.co"`
     - `SUPABASE_ANON_KEY = "..."`
   - inicializar `createClient()` diretamente com esses valores
   - remover qualquer fallback para `http://localhost`
   - manter o client seguro para browser e SSR sem inventar configuração ausente

2. Ajustar o estado derivado de configuração
   - garantir que `supabaseConfigured` continue compatível com a tela de login, agora sempre verdadeiro no frontend
   - evitar warnings falsos de “Supabase não configurado”

3. Validar o login admin
   - abrir `/admin/login`
   - confirmar que a tentativa de login dispara request real para o domínio do seu Supabase externo
   - verificar se o erro atual desaparece; se restar falha, identificar se passa a ser credencial real, RLS, ou configuração de Auth do projeto Supabase

## Resultado esperado
- o browser passa a usar seu Supabase externo diretamente
- a mensagem “Supabase não configurado” desaparece
- o login deixa de falhar por configuração ausente e passa a autenticar normalmente, ou exibir o erro real retornado pelo seu Supabase

## Arquivos envolvidos
- `src/integrations/supabase/client.ts`
- validação visual/comportamental em `/admin/login`