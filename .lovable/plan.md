## Correção da estrutura de rotas `/empreendimentos`

Atualmente `empreendimentos.tsx` é o pai de `empreendimentos.$slug.tsx`, mas renderiza a listagem em vez de `<Outlet />`. Isso faz com que `/empreendimentos/:slug` nunca apareça (o pai sobrescreve o filho).

### Passos

1. **Renomear** `src/routes/empreendimentos.tsx` → `src/routes/empreendimentos.index.tsx` (conteúdo inalterado — vira a rota index de `/empreendimentos`).

2. **Criar** novo `src/routes/empreendimentos.tsx` como layout vazio:
   ```tsx
   import { createFileRoute, Outlet } from '@tanstack/react-router'

   export const Route = createFileRoute('/empreendimentos')({
     component: () => <Outlet />,
   })
   ```

`routeTree.gen.ts` é regenerado automaticamente pelo plugin.

### Resultado
- `/empreendimentos` → listagem (index)
- `/empreendimentos/<slug>` → página de detalhe

### Fora de escopo
Nenhum outro arquivo é alterado (links, design, componentes permanecem como estão).
