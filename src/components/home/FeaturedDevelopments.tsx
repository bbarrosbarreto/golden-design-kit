import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import placeholder1 from "@/assets/dev-placeholder-1.png";
import placeholder2 from "@/assets/dev-placeholder-2.png";

type Development = {
  id: string;
  slug: string;
  name: string;
  region: string;
  builder: string;
  typology: string;
  cover_image_url: string;
  status: "ready" | "forecast";
  delivery_forecast?: string;
  price_from: number;
};

// Mock data — substituir por dados reais do Supabase depois
const MOCK: Development[] = [
  {
    id: "1",
    slug: "residencial-horizonte",
    name: "Residencial Horizonte",
    region: "Asa Sul, Brasília/DF",
    builder: "Construtora Paulo Octavio",
    typology: "2 e 3 quartos",
    cover_image_url: placeholder1,
    status: "forecast",
    delivery_forecast: "12/2026",
    price_from: 890000,
  },
  {
    id: "2",
    slug: "edificio-arquiteto",
    name: "Edifício Arquiteto",
    region: "Sudoeste, Brasília/DF",
    builder: "Brasal Incorporações",
    typology: "3 e 4 quartos",
    cover_image_url: placeholder2,
    status: "ready",
    price_from: 1450000,
  },
  {
    id: "3",
    slug: "vertical-noroeste",
    name: "Vertical Noroeste",
    region: "Noroeste, Brasília/DF",
    builder: "Via Empreendimentos",
    typology: "2 quartos",
    cover_image_url: placeholder1,
    status: "forecast",
    delivery_forecast: "06/2027",
    price_from: 720000,
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function FeaturedDevelopments() {
  const items = MOCK;
  const [index, setIndex] = useState(0);
  const total = items.length;
  const current = items[index];

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-heading text-3xl text-foreground md:text-4xl">
            Empreendimentos em Destaque
          </h2>
          <Button asChild variant="outline-gold" size="lg">
            <Link to="/empreendimentos">Ver Todos</Link>
          </Button>
        </div>

        {/* Carrossel */}
        <div className="relative mt-12 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          {current ? (
            <Slide dev={current} />
          ) : (
            <SlideSkeleton />
          )}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Anterior"
                className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background md:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Próximo"
                className="absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background md:flex"
                style={{ left: "calc(55% - 3.5rem)" }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Próximo"
                className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background md:hidden"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Slide({ dev }: { dev: Development }) {
  return (
    <div className="grid animate-in fade-in duration-300 md:grid-cols-[55%_45%]">
      {/* Imagem */}
      <div className="relative h-[320px] overflow-hidden bg-muted md:h-[480px]">
        <img
          src={dev.cover_image_url}
          alt={dev.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4">
          {dev.status === "ready" ? (
            <span className="rounded-md bg-badge-green px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-background">
              Pronta Entrega
            </span>
          ) : dev.delivery_forecast ? (
            <span className="rounded-md bg-badge-blue px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-background">
              Previsão {dev.delivery_forecast}
            </span>
          ) : null}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
        <p className="font-body text-sm uppercase tracking-wider text-muted-foreground">
          {dev.builder}
        </p>
        <h3 className="font-heading text-3xl text-foreground md:text-4xl">{dev.name}</h3>
        <p className="flex items-center gap-2 font-body text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {dev.region}
        </p>
        <p className="font-body text-muted-foreground">{dev.typology}</p>
        <p className="font-body text-xl font-medium text-primary">
          A partir de {formatPrice(dev.price_from)}
        </p>
        <div className="mt-4">
          <Button asChild variant="primary" size="lg">
            <a href={`/empreendimentos/${dev.slug}`}>Ver Detalhes</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SlideSkeleton() {
  return (
    <div className="grid md:grid-cols-[55%_45%]">
      <div className="h-[320px] animate-pulse bg-muted md:h-[480px]" />
      <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-11 w-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
