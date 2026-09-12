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
- [ ] Gerar XML nos formatos DF Imóveis e ZAP/VivaReal/OLX

## Etapa 3 — Integração e validação
- [ ] Testar URLs de feed nos portais
