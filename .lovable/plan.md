# Correção: chave "Exportar para portais" desligando sozinha

## Onde está a regra que desliga a chave

Há duas regras, as duas em `src/components/admin/PropertyForm.tsx`:

1. **Linhas 436–439**, um efeito que desliga a chave na tela assim que o anúncio fica incompleto:
   ```ts
   useEffect(() => {
     if (!ready && exportEnabled) setValue("export_enabled", false);
   }, [ready, exportEnabled, setValue]);
   ```
   Por isso o painel vermelho nunca aparece: a chave já está desligada quando você clica em salvar, e a validação das linhas 544+ só roda com a chave ligada.
2. **Linhas 335–337**, na montagem dos dados gravados:
   ```ts
   export_enabled: ready ? v.export_enabled : false,
   export_portals: ready && v.export_enabled ? v.export_portals : [],
   ```
   Além de desligar a chave, essa regra apaga os portais marcados (foi o que aconteceu com o BB1001).

Não existe trigger no banco que mexa nesses campos. As migrations do repositório não fazem nenhuma alteração automática em `export_enabled`.

## O que muda

1. **Remover as duas regras.** A chave e os portais só mudam quando você clicar neles. Os dados são gravados exatamente como estão na tela.
2. **Validação ao salvar:** continua a atual (linhas 544+). Com a exportação ligada e algum campo faltando, o anúncio não é salvo, a chave continua ligada, o painel vermelho lista os campos em português e a tela rola até o primeiro deles. Com a regra 1 removida, esse caminho volta a ser usado.
3. **Exigências por tipo:** `evaluateFormReadiness` em `src/lib/property-export.ts` (linhas 231–235 e 327–346) já pede quartos e banheiros só para apartamento, cobertura, casa e casa de condomínio. Lote, rural e comercial já ficam de fora. Essa regra fica como está.

## Tabela: tipo x campos obrigatórios x origem

Campos comuns a todos os tipos: título 10–100, logradouro, bairro, CEP com 8 dígitos, cidade, estado, descrição 50–3000, preço > 0, ao menos uma área, 5 imagens e ao menos um portal.

| Tipo | Comuns | Quartos e banheiros | Origem |
|---|---|---|---|
| Apartamento / Cobertura | sim | sim | Etapa 2 (seu pedido: "residenciais") |
| Casa / Casa de condomínio | sim | sim | Etapa 2 |
| Terreno (lote) | sim | não | Etapa 2 |
| Rural | sim | não | Etapa 2 |
| Comercial | sim | não | Etapa 2 |

Sobre o "documento de origem": os arquivos do Wimóveis em docs/navent/ só listam os campos que existem para cada tipo. Quartos, banheiros, vagas e áreas aparecem até para Terreno (1003). Nenhum desses arquivos diz o que é obrigatório. No repositório não há documentação do DF Imóveis nem do ZAP que defina obrigatoriedade por tipo. Por isso não vou criar nenhuma exigência nova. A tabela segue a regra que você definiu na Etapa 2.

## Diagnóstico (consultado agora, sem alterar nada)

**Imóveis com exportação desligada:**
| Código | Título | Portais marcados |
|---|---|---|
| BB1001 | Casa Jardim Botânico escriturada 3 quartos + escritório | nenhum (apagados pela regra 2) |

**Imóveis marcados para um portal que não aparecem no XML dele:**
| Código | Portal marcado | Motivo |
|---|---|---|
| BB1003 | ZAP / VivaReal / OLX | O /feeds/zap.xml lê os anúncios marcados para "DF Imóveis", não para "ZAP" (rota `feeds.zap[.]xml.ts`, linha 8: `generateZapFeed("dfimoveis")`). Hoje nenhum feed lê a marcação "grupozap". |
| BB1004 | ZAP / VivaReal / OLX | Mesmo motivo. |

Todos os outros aparecem nos feeds dos portais marcados: Wimóveis tem 12 de 12 e DF Imóveis tem 3 de 3 (BB1006, BB1012 e BB1013). O BB1012 (terreno) já está nos dois. Não vou religar nem mudar nada sozinho. A ligação do ZAP com "grupozap" fica para você decidir depois, porque mexe nos feeds.

## Não muda
Feeds, rotas e formato dos XMLs; banco; layout do formulário; regras de validação.

## Como confirmo
- Abrir o BB1012 e salvar sem alterar nada: a chave e os portais continuam iguais, e os três feeds trazem os mesmos códigos de antes.
- Esvaziar o CEP com a exportação ligada: o anúncio não é salvo, a chave continua ligada e o painel vermelho mostra "CEP".
- Verificação de tipos e build.
