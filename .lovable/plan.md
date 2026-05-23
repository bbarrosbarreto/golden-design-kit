# Plano

## Objetivo
Corrigir o login do admin usando **seu Supabase externo**, sem migrar para Lovable Cloud e sem introduzir soluções incompatíveis com a stack atual.

## O que já está confirmado
- O app **consegue sim** funcionar com Supabase externo.
- O browser já está chamando seu endpoint real de auth:
  `POST https://acteyqbhonzqtnujstao.supabase.co/auth/v1/token?grant_type=password`
- Portanto, o problema **não é mais** falta de configuração do client.
- Os erros atuais vêm do próprio backend de auth do seu projeto Supabase:
  - `invalid_credentials`
  - `unexpected_failure: Database error querying schema`

## O que vou corrigir na próxima etapa
1. **Validar o fluxo atual do frontend sem mudar a stack**
   - revisar apenas os arquivos de auth/admin já envolvidos
   - manter o cliente apontando direto para o seu Supabase externo
   - remover mensagens antigas que ainda falam em variáveis `VITE_*` se restarem no login

2. **Diagnosticar a causa real do erro de autenticação**
   - separar erro de credencial inválida de erro interno do projeto Supabase
   - confirmar se o problema ocorre no preview, no publicado, ou nos dois
   - verificar se existe algo no guard/login que mascara a resposta real

3. **Se o frontend estiver correto, parar de mexer no app e isolar o backend externo**
   - quando a resposta for `invalid_credentials`, tratar como credencial/email/senha do usuário criado no Auth
   - quando a resposta for `Database error querying schema`, tratar como falha no projeto Supabase externo (schema, trigger, função, policy, extensão, ou hook de auth), não do frontend

4. **Ajustar a UX do `/admin/login` para depuração objetiva**
   - exibir mensagens claras para cada cenário
   - evitar mensagens genéricas ou enganosas de configuração ausente
   - manter a tela alinhada à implementação real

## Entrega esperada
- app continua usando **somente seu Supabase externo**
- tela de login deixa de mostrar diagnóstico errado
- fica claro se o bloqueio restante está no frontend ou no Auth do seu projeto Supabase
- se o erro vier do Supabase, eu te aponto exatamente o que revisar lá, sem inventar integração nova

## Detalhe técnico
Hoje o indício mais importante é este:
- a request de login já chega no Supabase correto
- resposta `400 invalid_credentials` = email/senha não batem com um usuário válido do Auth
- resposta `500 Database error querying schema` = o Auth do projeto Supabase está quebrando ao consultar algo interno do banco

Isso normalmente aponta para problema no projeto Supabase externo, não na conexão do app.

## Limite de escopo
Não vou migrar para Lovable Cloud, nem trocar arquitetura, nem adicionar backend paralelo. Vou trabalhar em cima da stack atual e do seu Supabase externo.