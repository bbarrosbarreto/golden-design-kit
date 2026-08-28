import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";

const TITLE = "Sobre Bruno Barreto | Corretor com visão de arquiteto";
const DESCRIPTION =
  "Conheça Bruno Barreto, corretor de imóveis em Brasília/DF que une olhar de arquiteto e curadoria de alto padrão para orientar cada negociação.";
const URL = "https://brunobarretoimoveis.com.br/sobre";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "profile" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: SobrePage,
});


function useInViewFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 600ms ease, transform 600ms ease",
    } as React.CSSProperties,
  };
}

function GoldLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-[2px] w-12 bg-[#C9A84C] ${className}`}
    />
  );
}

function SobrePage() {
  const heroFade = useInViewFade<HTMLDivElement>();
  const quemSouFade = useInViewFade<HTMLDivElement>();
  const ajudarFade = useInViewFade<HTMLDivElement>();
  const paraQuemFade = useInViewFade<HTMLDivElement>();
  const ctaFade = useInViewFade<HTMLDivElement>();

  return (
    <Layout>
      {/* SEÇÃO 1 — HERO */}
      <section className="bg-[#1a1a1a] px-[5%] py-20">
        <div
          ref={heroFade.ref}
          style={heroFade.style}
          className="mx-auto max-w-6xl"
        >
          <span className="text-[11px] font-medium uppercase tracking-[3px] text-[#C9A84C]">
            SOBRE
          </span>
          <h1 className="mt-4 max-w-[640px] font-heading text-4xl leading-tight text-white md:text-[48px]">
            Arquitetura aplicada ao mercado imobiliário
          </h1>
          <p className="mt-4 max-w-[560px] text-lg leading-relaxed text-white/70">
            Uma abordagem diferente para encontrar, avaliar e investir em imóveis.
          </p>
        </div>
      </section>

      {/* SEÇÃO 2 — QUEM SOU */}
      <section className="bg-[#FAFAF8] px-[5%] py-20">
        <div
          ref={quemSouFade.ref}
          style={quemSouFade.style}
          className="mx-auto max-w-6xl"
        >
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[55%_45%]">
            {/* Coluna esquerda */}
            <div>
              <h2 className="font-heading text-[34px] text-[#1a1a1a]">
                Quem sou
              </h2>
              <GoldLine className="mt-4" />
              <p className="mt-6 text-[17px] leading-[1.85] text-[#555]">
                Sou Bruno Barreto, corretor de imóveis e arquiteto formado pela Universidade de Brasília — uma das dez melhores instituições do país na área.
              </p>
              <p className="mt-4 text-[17px] leading-[1.85] text-[#555]">
                Minha formação e atuação em arquitetura e decoração me deram um olhar que vai além do metro quadrado: consigo avaliar um imóvel com precisão técnica, identificar seu potencial real e entender como cada espaço pode ser transformado para atender às suas necessidades específicas.
              </p>
              <p className="mt-4 text-[17px] leading-[1.85] text-[#555]">
                Essa combinação — visão de arquiteto e atuação no mercado imobiliário — é o que me permite oferecer uma curadoria verdadeiramente personalizada.
              </p>
            </div>

            {/* Coluna direita */}
            <div className="bg-white p-8 shadow-sm" style={{ borderLeft: "3px solid #C9A84C" }}>
              <span className="text-xs font-medium uppercase tracking-[1.5px] text-[#999]">
                Formação
              </span>
              <p className="mt-2 text-lg font-semibold text-[#1a1a1a]">
                Arquitetura e Urbanismo
              </p>
              <p className="mt-1 text-[15px] text-[#555]">
                Universidade de Brasília — UnB
              </p>
              <p className="mt-1 text-[13px] text-[#C9A84C]">
                Entre as 10 melhores do Brasil na área
              </p>

              <div className="my-6 h-px bg-[#e8e4dd]" />

              <span className="text-xs font-medium uppercase tracking-[1.5px] text-[#999]">
                Atuação
              </span>
              <p className="mt-2 text-[15px] text-[#555]">
                Mercado Imobiliário · Arquitetura · Decoração
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — COMO POSSO AJUDAR */}
      <section className="bg-white px-[5%] py-20">
        <div
          ref={ajudarFade.ref}
          style={ajudarFade.style}
          className="mx-auto max-w-6xl"
        >
          <div className="text-center">
            <h2 className="font-heading text-[34px] text-[#1a1a1a]">
              Como posso ajudar
            </h2>
            <GoldLine className="mx-auto mt-4" />
            <p className="mx-auto mt-4 max-w-[560px] text-[17px] text-[#999]">
              Da escolha ao investimento — uma assessoria completa com olhar de arquiteto.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div
              className="border border-[#e8e4dd] bg-[#FAFAF8] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ borderTop: "3px solid #C9A84C" }}
            >
              <span className="text-[32px]">🏠</span>
              <h3 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
                Curadoria Personalizada
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#555]">
                Seleciono imóveis com base no seu perfil, gosto e orçamento — seja para morar ou investir. Cada indicação é pensada para o seu momento de vida.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="border border-[#e8e4dd] bg-[#FAFAF8] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ borderTop: "3px solid #C9A84C" }}
            >
              <span className="text-[32px]">📐</span>
              <h3 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
                Avaliação Técnica
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#555]">
                Avalio cada imóvel com precisão técnica de arquiteto: estrutura, potencial de reforma, qualidade construtiva e valorização real — antes de você decidir.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="border border-[#e8e4dd] bg-[#FAFAF8] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ borderTop: "3px solid #C9A84C" }}
            >
              <span className="text-[32px]">📈</span>
              <h3 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
                Estratégia de Investimento
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#555]">
                Estruturo planos de aquisição via financiamento ou consórcio, com projeção de retorno por aluguel permanente, temporada ou Airbnb — transformando imóvel em renda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — PARA QUEM */}
      <section className="bg-[#F5F3EE] px-[5%] py-20">
        <div
          ref={paraQuemFade.ref}
          style={paraQuemFade.style}
          className="mx-auto max-w-6xl"
        >
          <h2 className="font-heading text-[34px] text-[#1a1a1a]">
            Para quem é esse serviço
          </h2>
          <GoldLine className="mt-4" />
          <p className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-[#555]">
            Atendo clientes com objetivos distintos, sempre com a mesma dedicação e precisão.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card "Para morar" */}
            <div className="bg-white p-8">
              <span className="text-[32px]">🏡</span>
              <h3 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
                Para quem vai morar
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#555]">
                Encontro o imóvel certo para o seu jeito de viver — levando em conta rotina, família, entorno e potencial de personalização.
              </p>
            </div>

            {/* Card "Para investir" */}
            <div className="bg-white p-8">
              <span className="text-[32px]">💼</span>
              <h3 className="mt-4 text-lg font-semibold text-[#1a1a1a]">
                Para quem quer investir
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#555]">
                Analiso o potencial de valorização e rentabilidade, estruturo a aquisição e projeto a renda com aluguel de longa ou curta temporada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — CTA */}
      <section className="bg-[#1a1a1a] px-[5%] py-20">
        <div
          ref={ctaFade.ref}
          style={ctaFade.style}
          className="mx-auto max-w-6xl text-center"
        >
          <h2 className="font-heading text-[40px] text-white">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Vamos conversar sobre o seu objetivo.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://wa.me/5561989119530"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <span>💬</span> Falar no WhatsApp
            </a>
            <Link
              to="/imoveis"
              className="inline-flex items-center gap-2 rounded-md border border-[#C9A84C] bg-transparent px-8 py-3 text-sm font-medium text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10"
            >
              Ver Imóveis
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
