# Adicionar região "Jardim Botânico"

## Objetivo

Disponibilizar a região **Jardim Botânico** nos seletores de região dos formulários de imóveis e empreendimentos (admin) e nos filtros públicos.

## Como funciona hoje

Os selects de região em `DevelopmentForm.tsx` e `PropertyForm.tsx` (e os filtros públicos) leem a tabela `regions` do banco, filtrando `active = true` e ordenando por `display_order`. Ou seja: basta inserir a região no banco — nenhum código precisa mudar.

## Execução

1. Verificar no banco se já existe uma linha "Jardim Botânico" (evitar duplicata).
2. Inserir na tabela `regions`:
   - `name`: "Jardim Botânico"
   - `active`: true
   - `display_order`: próximo número após o maior valor existente (aparece ao final da lista)
3. Confirmar que a região aparece nos selects de `/admin/empreendimentos` e `/admin/imoveis`.

## Fora de escopo

- Nenhuma alteração de código, layout ou outras regiões.
