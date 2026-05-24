## Mudanças

### 1. `src/lib/development-images.ts`
Adicionar `{ value: "capa", label: "Capa" }` como **primeira entrada** de `IMAGE_CATEGORIES`. O mapeamento legado "lazer" → "area_comum" permanece. `normalizeImages` continua aceitando string[] (legado) e `{ url, category }[]` (jsonb atual).

Exportar nova helper:
```ts
export function pickCoverImage(input: unknown): DevImage | null
```
Regra: primeiro item com `category === "capa"`; senão primeiro com `category === "fachada"`; senão o primeiro item; senão `null`.

### 2. `src/routes/empreendimentos.$slug.tsx`
- Trocar `const images = imageUrls(dev.images)` por uma normalização que mantenha a categoria e reordene para colocar a capa (capa > fachada > primeira) como **primeiro item** do array exibido na galeria.
- Hero (`images[activeImg]`) continua usando o índice 0 por padrão → herda a capa automaticamente.
- Sem mudança de layout/design.

### 3. `src/routes/empreendimentos.tsx`
Já está correto (`createFileRoute('/empreendimentos')` com `Outlet`). Nenhuma ação.

### 4. Galeria/upload no admin
- `ImageUploader` já lê `image.url` (não a string) e o upload já salva `{ url, category: "outros" }`. Após a migration para jsonb, isso persiste corretamente.
- Como `"capa"` agora é a primeira opção do select, o usuário pode marcar a foto desejada como capa direto no card. Nenhuma mudança de código no uploader.

### 5. Consumidores que mostram thumbnail (`empreendimentos.index.tsx`, `FeaturedDevelopments.tsx`, `admin/empreendimentos.tsx`)
Trocar `imageUrls(d.images)[0]` por `pickCoverImage(d.images)?.url ?? null` para que listagens/destaques também usem a capa quando definida. Sem mudança visual além da escolha da imagem.

## Fora de escopo

- Migrar nada no banco (já é jsonb conforme informado).
- Alterar design, layout, formulário ou comportamento de outras seções.
- Mudar default de categoria no upload (continua "outros" — usuário marca capa manualmente).
