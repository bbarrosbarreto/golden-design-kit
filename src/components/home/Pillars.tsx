import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gem,
  Handshake,
  Rocket,
  Ruler,
  ShieldCheck,
  Target,
} from "lucide-react";

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
  const [index, setIndex] = useState(0);
  const total = pillars.length;
  const go = (i: number) => setIndex((i + total) % total);

  return (
    <section className="bg-surface py-16">
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

        {/* Desktop: 6 cards em linha única */}
        <div className="mt-12 hidden overflow-hidden md:grid md:grid-cols-6 md:gap-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group flex flex-col items-center rounded-lg border border-border bg-background p-4 text-center transition-all duration-300 hover:border-primary hover:shadow-gold"
              >
                <Icon className="text-primary" size={22} strokeWidth={1.5} />
                <h3 className="mt-3 font-heading text-sm leading-tight text-foreground">
                  {pillar.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* Mobile: carrossel 1 por vez */}
        <div className="mt-12 md:hidden">
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.title} className="w-full flex-shrink-0 px-2">
                      <div className="group flex flex-col items-center rounded-lg border border-border bg-background p-8 text-center transition-all duration-300 hover:border-primary hover:shadow-gold">
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
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              aria-label="Anterior"
              onClick={() => go(index - 1)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 backdrop-blur transition hover:border-primary hover:text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              onClick={() => go(index + 1)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 backdrop-blur transition hover:border-primary hover:text-primary"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {pillars.map((p, i) => (
              <button
                key={p.title}
                type="button"
                aria-label={`Ir para ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-primary" : "w-2 bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
