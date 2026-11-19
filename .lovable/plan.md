# DF Imóveis v1.6: tipos, áreas e destaque por portal

## Parte A — Correções no feed DF Imóveis (`src/lib/feed-dfimoveis.ts`)

**A1. Tipos/subtipos** — reescrever `dfPropertyType` para devolver `{tipo, subtipo} | null`:
- apartamento → Apartamento; category cobertura/duplex/triplex/mobiliado/loft → subtipo correspondente; demais → Padrão (com acento; hoje sai "Padrao")
- cobertura → Apartamento / Cobertura
- casa → Casa / Sobrado se category começa com "sobrado", senão Padrão (hoje "Térrea")
- casa_condominio → Casa Condomínio / Sobrado ou Padrão (hoje "Casa / Condomínio")
- terreno → Lote / Residencial (hoje "Lote Residencial")
- comercial → Sala / Padrão (hoje "Sala / Sala")
- rural → Rural / Chácara-Sítio
- Type desconhecido → `null`: `console.warn` com listing_code e o imóvel é omitido (hoje cai em Apartamento/Padrao).

**A2. Áreas** (inteiros sem separador, nunca 0 nem vazio):
- AreaUtil = useful_area → built_area → area
- AreaTotal = area → AreaUtil
- AreaDoTerreno = area, só para casa, casa_condominio, terreno, rural (hoje só terreno/rural); nunca para apartamento/cobertura
- Elegibilidade existente (alguma área preenchida) permanece; com ela, AreaUtil e AreaTotal sempre saem.

## Parte B — Configuração por portal

**B1. Banco** — novo arquivo `supabase-migrations/2026-11-19-export-highlight-portals.sql` (você aplica no seu Supabase; não executo):
```sql
alter table public.properties
  add column if not exists export_highlight_portals text[] not null default '{}';
```
`featured`/`featured_order` não são lidos nem alterados.

**B2. Formulário (`PropertyForm.tsx`)**
- Estrutura exata pedida: chave "Exportar este imóvel para portais" → (se ligada) lista de portais → um bloco por portal marcado.
- Novo componente reutilizável `PortalExportBlock` (título + conteúdo específico por portal), com os mesmos Checkbox/Label/espaçamentos/tokens já usados; nada novo de cor ou fonte.
  - DF Imóveis: "Destaque no portal" + contador
  - Wimóveis: "Destaque no portal" desabilitado + "Aguardando o portal confirmar os valores aceitos"; valor nunca gravado
  - Grupo ZAP: "Sem configurações específicas por enquanto"
- Desmarcar um portal remove-o de `export_highlight_portals` e esconde o bloco. No save, `export_highlight_portals` é filtrado para portais presentes em `export_portals` e com `HIGHLIGHT_SUPPORTED[portal] === true`.
- Chave de exportação desligada: lista e blocos ocultos (valores salvos permanecem, coerente com a correção anterior).
- `src/lib/property-export.ts`: `DESTAQUE_LIMITS = { dfimoveis: 3, wimoveis: null, grupozap: null }` e `HIGHLIGHT_SUPPORTED = { dfimoveis: true, wimoveis: false, grupozap: false }`. A caixa de destaque fica desabilitada quando o portal não é suportado (sem nenhum "wimoveis" fixo no formulário).
- Contador: espelha a elegibilidade do feed — `active = true`, `status = 'disponivel'`, `export_enabled = true`, portal em `export_portals` E em `export_highlight_portals`; excluindo o imóvel aberto e somando o estado atual da caixa (fica correto antes de salvar). Texto "X de N destaques usados"; acima de N, texto em `text-destructive` (mesmo token do resumo de erro), sem bloquear o save. Limite null → "Limite não confirmado com o portal", sem contagem.

**B3. Feed DF Imóveis** — incluir `export_highlight_portals` no SELECT; emitir `<Destaque>1</Destaque>` só quando contém "dfimoveis", logo depois de `UnidadeMetrica` e antes de `QtdDormitorios` (posição de Longitude na tabela, que não é enviada). Comentário no código registra que a posição é escolha nossa: a documentação lista Destaque entre Longitude e QtdDormitorios; como não enviamos Longitude, a tag fica colada em QtdDormitorios. Nunca enviar 0; sem UltraDestaque.

**B4. Feed Wimóveis** — apenas um comentário junto ao `tipoPublicacao` SIMPLE indicando a futura derivação por `export_highlight_portals`. Saída byte-idêntica.

## Não alterado
evaluateReadiness, isReady, feed-common.ts, feed-zap.ts (bug grupozap fica para outra etapa), featured/featured_order.

## Verificação
- Ordem: você aplica o SQL no Supabase ANTES de qualquer publicação. Nada é publicado até você avisar que a coluna existe; até lá, o feed DF e o formulário (que passam a ler a coluna) só funcionam no preview após o SQL.
- Comparar wimoveis.xml e zap.xml com baseline (idênticos); validar dfimoveis.xml bem formado, todos os pares na tabela v1.6, AreaUtil/AreaTotal em todos, AreaDoTerreno só nos tipos com terreno; testar Destaque com dado simulado (presente com 1, ausente quando desmarcado).
- Testes unitários pequenos para o mapeamento de tipos e regra de áreas.
