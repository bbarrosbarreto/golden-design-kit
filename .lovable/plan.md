# Plano: Renomear categoria "Quintal" para "Jardim"

## Objetivo
Substituir a categoria de fotos "Quintal" por "Jardim" no formulário de imóveis e na galeria pública, preservando fotos já salvas como "quintal".

## Alterações

1. **Atualizar rótulo e valor da categoria**
   - Arquivo: `src/lib/property-images.ts`
   - Na lista `PROPERTY_CATEGORIES.casa`, trocar `{ value: "quintal", label: "Quintal" }` por `{ value: "jardim", label: "Jardim" }`.

2. **Compatibilidade com fotos antigas**
   - Em `normalizePropImages`, mapear a categoria legada `"quintal"` para `"jardim"` antes de validar contra o conjunto de categorias válidas. Isso evita que fotos já classificadas como "Quintal" sejam reclassificadas como "Outros".

3. **Verificar referências restantes**
   - Buscar por `"quintal"` no restante do projeto. Se houver referências em componentes de galeria, filtros ou agrupamento, atualizar para `"jardim"`.

4. **Validação**
   - Rodar `bun run build:dev` para garantir que a alteração não quebra a compilação.

## Fora de escopo
- Não alterar outras categorias.
- Não modificar layout, design system ou comportamento de upload.
