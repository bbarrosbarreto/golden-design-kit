# Conectar projeto ao GitHub (Git Sync)

## Objetivo
Sincronizar o código-fonte deste projeto Lovable com um repositório GitHub do usuário, permitindo backup, versionamento e desenvolvimento paraleto via Git.

## Como fazer

O Git Sync do Lovable é configurado diretamente no editor do Lovable, não via alteração de código. Passos:

1. No editor do Lovable, abrir o menu **Plus (+)** no canto inferior esquerdo do chat.
2. Escolher **GitHub → Connect project**.
3. Autorizar o app **Lovable GitHub App** na conta GitHub.
4. Selecionar a conta ou organização onde o repositório será criado.
5. Clicar em **Create Repository** no Lovable para gerar o repositório com o código do projeto.

## Resultado esperado
- Todo o código atual do projeto é enviado para o repositório GitHub criado.
- Alterações feitas no Lovable são sincronizadas automaticamente com o GitHub.
- Alterações feitas no GitHub (push) são sincronizadas de volta para o Lovable.
- É possível clonar o repositório localmente e trabalhar em paralelo.

## Limitações
- O Lovable não importa repositórios GitHub existentes diretamente.
- Se o objetivo for apenas versionar/colaraborar no código, o Git Sync é o caminho correto.
- Se o objetivo for que o app leia dados da API do GitHub (issues, repos, etc.), aí seria o **GitHub Connector**, que requer configuração no backend do app.

## Notas
- Nenhuma alteração de código é necessária para ativar o Git Sync.
- Após conectar, o botão de publicar/deploy do Lovable continua funcionando normalmente; o GitHub passa a ser apenas o espelho/versionador do código.
