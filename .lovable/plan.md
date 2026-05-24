## Problema

`developments.images` é `text[]` no Postgres. O form envia objetos `{ url, category }`, mas o PostgREST só consegue persistir strings nesse tipo, então a `category` é perdida e ao reabrir todas as fotos caem em "Outros".

A mesma situação provavelmente afeta `properties.images` (a verificar e migrar junto, para manter consistência).

## Plano

### 1. Migração de schema (`developments.images` text[] → jsonb)

Criar uma migration que:

- Adiciona coluna temporária `images_jsonb jsonb` com default `'[]'::jsonb`.
- Faz backfill convertendo cada string do `text[]` atual em `{ "url": <string>, "category": "outros" }`:
  ```sql
  UPDATE developments
  SET images_jsonb = COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('url', u, 'category', 'outros'))
     FROM unnest(images) AS u),
    '[]'::jsonb
  );
  ```
- Dropa a coluna `images` antiga e renomeia `images_jsonb` para `images`.
- Define `NOT NULL DEFAULT '[]'::jsonb`.

Fazer o mesmo para `properties.images` se também for `text[]` (verificar antes da migration; se já for jsonb, pular).

### 2. Código

O frontend já está preparado para `{ url, category }[]`:
- `normalizeImages` aceita string[] (legado) e `{ url, category }[]`.
- `toPayload` em `DevelopmentForm` envia `v.images` no novo formato.
- Leitores (`imageUrls`) extraem URLs.

Não é necessária mudança em código — após a migration, o INSERT/UPDATE já vai persistir o objeto completo (jsonb aceita arrays de objetos nativamente).

### 3. Verificação

Após aplicar:
1. Abrir um empreendimento existente no admin → fotos aparecem com categoria "Outros" (esperado, herdado do backfill).
2. Alterar a categoria de uma foto, salvar, reabrir → categoria preservada.
3. Upload de nova foto + categoria + salvar → categoria preservada.

## Fora de escopo

- Mudar UI ou comportamento do `ImageUploader`/`DevelopmentForm`.
- Categorizar retroativamente as fotos existentes (todas viram "outros"; o admin re-categoriza pela interface).
