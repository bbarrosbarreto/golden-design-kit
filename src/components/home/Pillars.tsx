import { Gem, Handshake, Rocket, Ruler, ShieldCheck, Target } from "lucide-react";

const pillars = [
  {
    icon: Ruler,
    title: "Olhar de Arquiteto",
    description:
      "Avalio cada imóvel além da estética — projeto, funcionalidade e potencial.",
  },
  {
    icon: Gem,
    title: "Curadoria de Alto Padrão",
    description:
      "Seleção criteriosa de empreendimentos e imóveis que realmente entregam valor.",
  },
  {
    icon: Target,
    title: "Atendimento Personalizado",
    description:
      "Cada cliente é único. Seu projeto de vida merece dedicação exclusiva.",
  },
  {
    icon: Handshake,
    title: "Negociação Transparente",
    description:
      "Clareza em cada etapa. Você sempre sabe o porquê de cada decisão.",
  },
  {
    icon: Rocket,
    title: "Nova Geração Imobiliária",
    description:
      "Tecnologia, agilidade e visão moderna para um mercado em transformação.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança Jurídica",
    description:
      "Acompanhamento completo da documentação até a entrega das chaves.",
  },
];

export function Pillars() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl text-foreground md:text-4xl">
            Por que Bruno Barreto
          </h2>
          <p className="mt-4 font-body text-muted-foreground">
            Uma nova forma de comprar e investir em imóveis
          </p>
        </div>

        {/* Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group rounded-lg border border-border bg-background p-10 transition-all duration-300 hover:border-primary hover:shadow-gold"
              >
                <Icon
                  className="text-primary"
                  size={28}
                  strokeWidth={1.5}
                />
                <h3 className="mt-6 font-heading text-xl text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
