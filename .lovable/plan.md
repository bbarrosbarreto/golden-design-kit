# Plano: página admin de imóveis

## O que vou implementar

1. **Criar a rota `/admin/imoveis`**
   - Página com o mesmo padrão visual do admin de empreendimentos.
   - Cabeçalho com título **Imóveis** e botão **Novo Imóvel**.
   - Tabela com as colunas: Título, Tipo, Status, Região, Preço, Ativo e Ações.
   - Confirmação antes de excluir.

2. **Criar o formulário de imóvel (criação/edição)**
   - Modal/drawer reutilizando o padrão visual já usado no admin.
   - Campos do schema já existente no banco, incluindo relacionamento com região e empreendimento.
   - Geração de slug, validação, edição e persistência via Lovable Cloud.
   - Comportamento condicional por tipo de imóvel quando fizer sentido nos campos e categorias de imagem.

3. **Ajustar o fluxo de imagens para imóveis**
   - Upload no bucket público `properties`.
   - Salvar e editar imagens no formato `jsonb`: `[{ url, category }]`.
   - Categorias específicas por tipo de imóvel, sem quebrar o uploader já usado por empreendimentos.

4. **Adicionar “Imóveis” no menu admin**
   - Inserir o link na sidebar/menu ao lado de **Empreendimentos**, seguindo o padrão visual existente.

5. **Garantir atualização da listagem após CRUD**
   - Invalidar o cache do React Query após criar, editar e excluir.

## Arquivos previstos

- **Novo:** `src/routes/admin/imoveis.tsx`
- **Novo:** `src/components/admin/PropertyForm.tsx`
- **Novo:** `src/lib/property-images.ts`
- **Editar:** `src/components/admin/ImageUploader.tsx`
- **Editar:** `src/components/admin/AdminLayout.tsx`

## Detalhes técnicos

- Query principal baseada em `properties` com joins de `regions` e `developments`.
- Operações de CRUD usando os métodos já definidos para `properties`.
- Exclusão com `delete().eq('id', id)`.
- Upload mantendo estrutura pública do bucket `properties`.
- Sem migration e sem mudanças fora da área admin, exceto o item mínimo do menu admin.
- Sem alterar layout público do site nem rotas públicas.

## Resultado esperado

- Novo item **Imóveis** no admin.
- Tela administrativa funcional para listar, criar, editar e excluir imóveis.
- Upload e leitura de imagens compatíveis com `jsonb` no formato novo.