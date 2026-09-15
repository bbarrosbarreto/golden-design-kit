# Roadmap — Exportação XML para portais imobiliários

## Etapa 1 — Banco e formulário admin
- [x] Formulário admin com endereço estruturado, exportação, categoria e painel de prontidão
- [x] Migration `2026-09-12-export-portais.sql` aplicada no Supabase

## Etapa 1.5 — Tipos e categorias
- [x] Categoria depende do tipo (7 tipos × categorias válidas)
- [x] Tipo "Rural / Chácara" em formulário, painel, listagem e detalhe
- [x] Filtro público de tipo lista só os tipos com imóvel ativo
- [x] Constraint de `type` com 7 valores e exclusão do BB1005 (aplicados pelo usuário)

## Etapa 2 — Rotas de feed XML
- [x] Feed padrão ZAP em /feeds/zap.xml (gerador `feed-zap.ts`, portal dfimoveis)
- [x] Checkbox Wimóveis em EXPORT_PORTALS (só dado, sem feed)
- [x] Feed Wimóveis (formato OpenNavent, gerador `feed-opennavent.ts` e rota /feeds/wimoveis.xml)

## Etapa 2C — Características e tipos oficiais (concluída)
- [x] Catálogos da Navent salvos em `docs/navent/` com README de origem dos ids
- [x] `NAVENT_TYPE_MAP` com idTipo/idSubTipo oficiais e operações VENTA/ALQUILER
- [x] Bloco `<caracteristicas>` (quartos, banheiros, suítes, vagas, áreas, idade do imóvel)
- [ ] Mapear `<idLocalidade>` do catálogo de localidades (etapa futura)


## Etapa 2.5 — Ajustes de qualidade do feed ZAP
- [x] Nunca emitir tag vazia no XML
- [x] Logradouro obrigatório para exportação (8 itens no painel de prontidão)
- [x] Upload de imagens convertido para JPEG 1920px/85% antes do envio
- [x] Campos obrigatórios no formulário quando exportação está ligada
- [x] Número opcional (S/N se não houver) e omitido do feed quando vazio

## Etapa 3 — Integração e validação
- [ ] Testar URLs de feed nos portais
