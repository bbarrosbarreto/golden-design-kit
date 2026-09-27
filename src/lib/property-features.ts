/**
 * Lista FECHADA de características do imóvel (coluna `features`, text[]).
 * Cada item existe na tabela do DF Imóveis (`df`) e/ou no catálogo Navent
 * (`navent`, ver docs/navent/). Não adicionar itens fora dessas fontes.
 */
export type PropertyFeature = {
  key: string;
  label: string;
  group: "comuns" | "privativa";
  df: string | null;
  navent: number | null;
};

const f = (
  key: string,
  label: string,
  group: PropertyFeature["group"],
  df: string | null,
  navent: number | null,
): PropertyFeature => ({ key, label, group, df, navent });

export const PROPERTY_FEATURES: readonly PropertyFeature[] = [
  // Áreas comuns do condomínio (17)
  f("piscina_condominio", "Piscina (condomínio)", "comuns", "Piscina", 10140),
  f("churrasqueira_condominio", "Churrasqueira (condomínio)", "comuns", "Churrasqueira", 10048),
  f("salao_festas", "Salão de festas", "comuns", "SalaoFestas", 10181),
  f("salao_jogos", "Salão de jogos", "comuns", "SalaoJogos", 10182),
  f("academia", "Academia", "comuns", "SalaGinastica", 10090),
  f("quadra_esportiva", "Quadra esportiva", "comuns", "QuadraEsportiva", 10165),
  f("sauna", "Sauna", "comuns", "Sauna", 10183),
  f("playground", "Playground", "comuns", "PlayGround", 10152),
  f("area_lazer", "Área de lazer", "comuns", "AreaLazer", 10016),
  f("guarita", "Guarita", "comuns", "Guarita", 10103),
  f("cameras_seguranca", "Câmeras de segurança", "comuns", "CircuitoTv", 10030),
  f("elevador", "Elevador", "comuns", null, 10071),
  f("portaria_24h", "Portaria 24h", "comuns", null, 10158),
  f("brinquedoteca", "Brinquedoteca", "comuns", null, 10028),
  f("estacionamento_visitantes", "Estacionamento p/ visitantes", "comuns", null, 10084),
  f("acesso_deficientes", "Acesso para deficientes", "comuns", null, 10005),
  f("bicicletario", "Bicicletário", "comuns", null, 10027),
  // Área privativa da unidade (18)
  f("varanda", "Varanda", "privativa", "Varanda", 20199),
  f("area_servico", "Área de serviço", "privativa", "AreaServico", 20017),
  f("escritorio", "Escritório", "privativa", "Escritorio", 20077),
  f("ar_condicionado", "Ar condicionado", "privativa", "ArCondicionado", 20012),
  f("piscina_privativa", "Piscina privativa", "privativa", "Piscina", 20140),
  f("churrasqueira_privativa", "Churrasqueira privativa", "privativa", "Churrasqueira", 20048),
  f("closet", "Closet", "privativa", null, 20050),
  f("espaco_gourmet", "Espaço gourmet", "privativa", null, 20080),
  f("cozinha_gourmet", "Cozinha gourmet", "privativa", null, 20057),
  f("lareira", "Lareira", "privativa", null, 20114),
  f("hidromassagem", "Hidromassagem", "privativa", null, 20106),
  f("mobiliado", "Mobiliado", "privativa", null, 20126),
  f("dependencia_empregada", "Dependência de empregada", "privativa", null, 20062),
  f("interfone", "Interfone", "privativa", "Interfone", null),
  f("lavabo", "Lavabo", "privativa", "Lavabo", null),
  f("gas_canalizado", "Gás canalizado", "privativa", "GasCanalizado", null),
  f("portao_eletronico", "Portão eletrônico", "privativa", "PortaoEletronico", null),
  f("cozinha_armarios", "Cozinha com armários", "privativa", "CozinhaComArmarios", null),
];

const LABELS = new Map(PROPERTY_FEATURES.map((x) => [x.key, x.label]));

export function featureLabel(key: string): string {
  return LABELS.get(key) ?? key;
}
