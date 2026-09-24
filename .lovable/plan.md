# Etapa 2E: aceitar fotos HEIC do iPhone no upload

Arquivo tocado: `src/components/admin/ImageUploader.tsx` (e `package.json` para a nova dependência). Feeds, PropertyForm e banco não mudam.

## 1. Biblioteca

- Adicionar `heic2any` (roda no navegador, decodificador libheif embutido, sem servidor).
- Carregada somente com `await import("heic2any")` dentro do caminho de fallback do HEIC. Nenhum import estático, então o pacote vira um arquivo separado e fica fora do bundle inicial.

## 2. `toJpeg(file)` com fallback

1. Caminho atual primeiro: `createImageBitmap(file, { imageOrientation: "from-image" })` (corrige a orientação EXIF), com fallback para `Image` + `URL.createObjectURL`.
2. Se falhar e `isHeic(file)` for verdadeiro:
   - `isHeic` verifica a extensão `.heic`/`.heif` (maiúsculas ou minúsculas) ou o tipo `image/heic`, `image/heif`, `image/heic-sequence`, `image/heif-sequence`; funciona com tipo vazio (Windows).
   - `heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })` e, se vier um array (HEIC com várias imagens), usar a primeira.
   - O JPEG intermediário volta pelo mesmo caminho do canvas: redimensiona para no máximo 1920px no maior lado e exporta em qualidade 0.85. Resultado final idêntico ao de JPG/PNG.
3. Se não for HEIC, ou se o fallback também falhar, gera erro e o arquivo é marcado como falha.

JPG, PNG e WEBP nunca passam pelo fallback, então a biblioteca não é carregada para eles.

## 3. Fila com no máximo 2 em paralelo

- Substituir o laço sequencial por um pool simples de 2 workers consumindo um índice compartilhado. Cada worker converte e envia um arquivo por vez.
- Entre os arquivos, `await new Promise(r => setTimeout(r, 0))` devolve o controle ao navegador para que a interface continue respondendo.
- Os resultados ficam em um array indexado pela posição original; a `order` de "outros" é atribuída ao final, na ordem de seleção, para que a numeração não dependa de qual arquivo terminou primeiro.
- Uma falha em um arquivo é registrada e o lote continua.

## 4. Progresso e mensagens

- Novo estado `progress: { done, total } | null`.
- O botão fica desativado durante o lote (para evitar um segundo envio ao mesmo tempo) e mostra o spinner com o texto "Convertendo {done} de {total}...". Nada trava, porque o trabalho é assíncrono e cede controle entre os arquivos.
- Se o lote tiver ao menos um HEIC: aviso fixo acima da grade, "Convertendo fotos do iPhone, isso pode levar alguns minutos", visível enquanto roda.
- Falha individual: `toast.error("Não foi possível converter NOME_DO_ARQUIVO")` (falha de envio mantém a mensagem atual com o nome do arquivo).
- No final:
  - sem falhas: o toast atual "N imagem(ns) enviada(s)";
  - com falhas: `toast.warning("X convertida(s) e enviada(s), Y não convertida(s)")`.
- As imagens bem-sucedidas são adicionadas ao formulário com um único `onChange`.

## 5. Verificação

- `tsgo` + build; confirmar no resultado do build que `heic2any` sai em um arquivo separado e que o tamanho do arquivo de entrada não aumenta.
- Playwright no preview: selecionar um PNG e confirmar que o arquivo do heic2any não é requisitado na rede. Selecionar um `.HEIC` de exemplo e confirmar que ele é requisitado e que a conversão produz um JPEG. O envio real ao Storage depende de sessão de admin: se ela não estiver disponível, o teste para na conversão e o envio fica para você validar.
- Lote de 20 HEIC: verificar que a aba continua respondendo (o progresso atualiza) e que nunca há mais de 2 conversões ao mesmo tempo.

## Detalhes técnicos

- `heic2any` usa um worker e WASM embutidos; é compatível com Vite e com renderização no servidor, porque só é importado dentro de um handler do navegador.
- Limitação: HEIC com codificação 10-bit/HDR pode sair com cores ligeiramente diferentes; se o arquivo não puder ser decodificado, cai na mensagem de falha individual.
