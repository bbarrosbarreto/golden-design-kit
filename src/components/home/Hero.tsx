import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src={heroBg}
        alt="Arquitetura moderna de Brasília"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1080}
        fetchPriority="high"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/50 to-foreground/70" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1>
          <span className="mb-6 block font-body text-xs font-medium uppercase tracking-[0.25em] text-primary">
            Bruno Barreto · Corretor de Imóveis em Brasília · CRECI-DF 34.060
          </span>
          <span className="block font-heading text-4xl leading-tight text-background sm:text-5xl md:text-6xl lg:text-7xl">
            Onde a arquitetura encontra oportunidade
          </span>
        </h1>


        <p className="mx-auto mt-6 max-w-xl font-body text-base text-background/80 sm:text-lg">
          Curadoria de alto padrão em imóveis no Distrito Federal
        </p>

        <div className="mt-10">
          <Button variant="primary" size="lg" asChild>
            <a
              href="https://wa.me/5561999350888"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com Bruno
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
