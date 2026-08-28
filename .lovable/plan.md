# Acesso admin + correções de SEO

Duas frentes: primeiro destravar seu login no admin, depois corrigir as pendências de SEO.

## Parte 1 — Recuperação de senha do admin (prioridade)

Hoje a tela `/admin/login` só tem email + senha. Não existe nenhum caminho de "esqueci minha senha", por isso você fica travado.

O que será feito:

1. **Link "Esqueci minha senha"** na tela `/admin/login`, abrindo um campo de email que dispara o envio do link de redefinição para o email cadastrado.
2. **Nova página `/admin/redefinir-senha`** (pública), onde você define a nova senha ao clicar no link recebido por email. Mostra confirmação e redireciona para o login.
3. **Mensagens claras** de erro/sucesso em português (email não encontrado, link expirado, senha muito curta, etc.).

Observação: o email de redefinição vai para o endereço cadastrado no usuário admin. Se você não tiver acesso a esse email, me avise — nesse caso o caminho é criar um novo usuário admin.

## Parte 2 — Correções de SEO

O scanner apontou 8 pendências. Serão corrigidas assim:

### Metadados por página (título, descrição, canonical, Open Graph)
Hoje só o `__root.tsx` define metadados, então todas as páginas compartilham o mesmo título e descrição. Cada rota pública ganha `head()` próprio com título único (<60 caracteres), descrição (50–160), `og:title`, `og:description`, `og:url` e `canonical` apontando para ela mesma:

- `/` — Home
- `/empreendimentos` e `/empreendimentos/$slug` (título/descrição/imagem vindos do empreendimento)
- `/imoveis` e `/imoveis/$slug` (idem, a partir do imóvel)
- `/sobre`
- `/contato`

Nas páginas de detalhe, a foto de capa vira `og:image`/`twitter:image`. As rotas `/admin/*` recebem `noindex`.

### Dados estruturados (JSON-LD)
- `RealEstateAgent` na home com nome "Bruno Barreto Imóveis", slogan e CRECI-DF 34060.
- `Product`/`RealEstateListing` nas páginas de detalhe de imóvel e empreendimento, usando os dados já carregados.

### Conteúdo e acessibilidade
- H1 da home passa a nomear o profissional e o serviço, mantendo o slogan como subtítulo (sem mudar o visual).
- Hierarquia de headings corrigida em `/empreendimentos` e `/imoveis` (títulos dos cards de `h3` para `h2`).
- `aria-label`/`<label>` nos filtros da listagem de imóveis.
- Alt text descritivo nas logos de parceiros ("Logo Cyrela" em vez de "Cyrela").

### Arquivos de rastreamento
- `public/robots.txt` liberando o site e bloqueando `/admin`.
- Sitemap dinâmico em `src/routes/sitemap[.]xml.ts`, listando as páginas fixas e todos os imóveis/empreendimentos ativos do banco.

### Google Search Console
Ainda não está conectado. Depois de publicar, posso conduzir a conexão e a verificação do domínio `brunobarretoimoveis.com.br` em uma etapa seguinte — precisa da sua autorização no fluxo do Google.

## Detalhes técnicos

- Metadados via `head()` do TanStack Router em cada arquivo de rota; canonical apenas nas folhas, nunca no `__root`.
- Nas rotas de detalhe, o `head()` lê `loaderData`/dados da query já existente — nenhuma query nova.
- Recuperação de senha via `supabase.auth.resetPasswordForEmail` com `redirectTo` para `/admin/redefinir-senha`, e `supabase.auth.updateUser({ password })` na página de redefinição.
- Nenhuma alteração de layout, paleta ou tipografia.
