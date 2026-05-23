import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FeaturedDevelopment as Development } from "@/lib/developments.functions";
import { featuredDevelopmentsQueryOptions } from "@/lib/developments.query";
import placeholder1 from "@/assets/dev-placeholder-1.png";
import placeholder2 from "@/assets/dev-placeholder-2.png";

const placeholders = [placeholder1, placeholder2, placeholder1];

function formatPrice(value?: number | null) {
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatForecast(value?: string | null) {
  if (!value) return null;
  if (/^\d{2}\/\d{4}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function FeaturedDevelopments() {
  const { data: items } = useSuspenseQuery({ ...featuredDevelopmentsQueryOptions });
  const [index, setIndex] = useState(0);

  const hasItems = items.length > 0;
  const total = hasItems ? items.length : 1;
  const current = hasItems ? items[index] : null;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <section className="bg-surface py-24 md:py-32">
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
            <Slide dev={current} fallback={placeholders[index % placeholders.length]} />
          ) : (
            <SlideSkeleton />
          )}

          {hasItems && total > 1 && (
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
                className="absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background"
                style={{ left: "calc(55% - 3.5rem)" }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {hasItems && total > 1 && (
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

function Slide({ dev, fallback }: { dev: Development; fallback: string }) {
  const price = formatPrice(dev.price_from);
  const forecast = formatForecast(dev.delivery_forecast);
  const isReady = (dev.status ?? "").toLowerCase() === "ready";

  return (
    <div
      key={dev.id}
      className="grid animate-in fade-in duration-300 md:grid-cols-[55%_45%]"
    >
      {/* Imagem */}
      <div className="relative h-[320px] overflow-hidden bg-muted md:h-[480px]">
        <img
          src={dev.cover_image_url || fallback}
          alt={dev.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4">
          {isReady ? (
            <span className="rounded-md bg-badge-green px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-background">
              Pronta Entrega
            </span>
          ) : forecast ? (
            <span className="rounded-md bg-badge-blue px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-background">
              Previsão {forecast}
            </span>
          ) : null}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
        {dev.builder && (
          <p className="font-body text-sm uppercase tracking-wider text-muted-foreground">
            {dev.builder}
          </p>
        )}
        <h3 className="font-heading text-3xl text-foreground md:text-4xl">{dev.name}</h3>
        {dev.region && (
          <p className="flex items-center gap-2 font-body text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {dev.region}
          </p>
        )}
        <p className="font-body text-muted-foreground">2 e 3 quartos</p>
        {price && (
          <p className="font-body text-xl font-medium text-primary">
            A partir de {price}
          </p>
        )}
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
