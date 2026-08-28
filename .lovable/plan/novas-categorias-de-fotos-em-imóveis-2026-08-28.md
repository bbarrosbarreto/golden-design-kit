# Novas categorias de fotos em Imóveis

## Objetivo
Adicionar três novas categorias ao select de fotos do formulário de imóveis: **Área de Serviço**, **Espaços de Lazer** e **Demais Espaços**.

## Mudança (arquivo único: `src/lib/property-images.ts`)

Adicionar às categorias de **apartamento** e **casa** (terreno mantém sua lista própria, que já é específica: Frente, Fundo, Lateral, Vista Aérea, Entorno):

| value | label |
|---|---|
| `area_servico` | Área de Serviço |
| `espacos_lazer` | Espaços de Lazer |
| `demais_espacos` | Demais Espaços |

Ordem no select (apartamento/casa): Capa, Fachada, Sala, Cozinha, Quarto, Banheiro, Área de Serviço, Lazer e Áreas Comuns (apto) / Área Externa e Quintal (casa), Espaços de Lazer, Demais Espaços, Planta, Outros.

## Efeitos automáticos (sem código extra)

- O select de categoria do upload no admin (`PropertyForm` + `ImageUploader`) passa a mostrar as novas opções, pois lê `categoriesFor(type)`.
- A página pública de detalhe do imóvel agrupa a galeria por categoria via `PROPERTY_CATEGORIES`, então as novas categorias aparecem como seções próprias na galeria.
- `normalizePropImages` já valida contra a lista de categorias — nenhuma migração de dados necessária (imagens antigas continuam válidas).

## Nada mais muda

Sem alteração de design, layout, banco de dados ou outros componentes.
