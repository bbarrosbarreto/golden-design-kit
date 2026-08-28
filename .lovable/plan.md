# Editor de Perguntas Frequentes no Admin

Etapa só de painel: criar o editor de FAQ e ligá-lo aos formulários de imóvel e empreendimento. Páginas públicas e JSON-LD ficam intocados.

## 0. Tokens de aviso no design system

Em `src/styles.css` adicionar, no `:root` e no `@theme inline`, as variáveis e tokens de cor `warning` no mesmo padrão das existentes:
- `:root`: `--warning: 38 75% 42%`, `--warning-foreground: 0 0% 100%`, `--warning-muted: 38 70% 94%`
- `@theme inline`: `--color-warning: hsl(var(--warning))`, `--color-warning-foreground: hsl(var(--warning-foreground))`, `--color-warning-muted: hsl(var(--warning-muted))`

## 1. Tipo e componente

Novo `src/lib/faq.ts`: tipo `FaqItem = { q: string; a: string }`, `normalizeFaq(value: unknown): FaqItem[]` (lê o jsonb, descarta lixo) e helpers de comparação sem acento/case e de preposição por região (`no Lago Sul`, `na Asa Norte`, padrão `em`).

Novo `src/components/admin/FaqEditor.tsx`, props `value`, `onChange`, `suggestions`:
- lista vertical de cards com Input (pergunta) + Textarea 3 linhas auto-expansível (resposta) e botões-ícone subir / descer / remover;
- "Adicionar pergunta" insere par vazio; contador discreto "{n} perguntas";
- "Gerar perguntas sugeridas" (`variant="outline"`) anexa apenas sugestões cuja pergunta ainda não existe (comparação sem acento/case), nunca sobrescreve, desabilita quando todas já entraram;
- card com "[PREENCHER" na resposta ganha borda `border-warning`, fundo `bg-warning-muted` e o texto "Falta preencher" em `text-xs text-warning`;
- havendo pendências, um `<Alert>` com fundo `bg-warning-muted` e texto `text-warning-foreground`: "{n} respostas ainda contêm texto de exemplo. Publicar assim prejudica o site — reescreva antes de salvar." Só aviso, salvamento continua liberado.

## 2. Sugestões

`src/lib/property-faq.ts` → `suggestPropertyFaq(prop)`: as 8 perguntas do briefing, omitindo por completo as que dependem de dados ausentes (sem `bedrooms` não gera a 2, sem `address` não gera a 4, etc.), preço em pt-BR e "valor sob consulta" quando nulo, concordância pela preposição da região.

`src/lib/development-faq.ts` → `suggestDevelopmentFaq(dev)`: as 8 perguntas de empreendimento usando `price_from`, `typology`, `area_from`/`area_to`, `status`/`delivery_date` (Pronta entrega ou MM/AAAA), `builder` (omitida se nulo) e região.

Ambas recebem o nome da região já resolvido pelo formulário (os forms guardam `region_id`; o nome sai da query de regiões que já existe).

## 3. Ligação nos formulários

Em `PropertyForm.tsx` e `DevelopmentForm.tsx`: campo `faq` no schema/estado, carregado com `normalizeFaq(row.faq)` e enviado no payload. Nova seção "Perguntas frequentes" logo depois do bloco de imagens, com o texto de ajuda em `text-muted-foreground text-xs`:
"Aparecem no final da página e são o que as IAs mais citam. Responda com números e detalhes concretos — evite frases genéricas."

## Notas técnicas

- Colunas `properties.faq` e `developments.faq` (jsonb default `[]`) já existem; nenhuma migration.
- Sem alterações em rotas públicas, JSON-LD ou uploads de imagem.
- Verificação: `bun run build:dev` + conferência de gerar duas vezes sem duplicar, reordenar/remover, e persistência após salvar.
