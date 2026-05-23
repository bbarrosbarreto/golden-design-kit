import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  getFeaturedDevelopments,
  type FeaturedDevelopment as Development,
} from "@/lib/developments.functions";
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
  // If already MM/AAAA
  if (/^\d{2}\/\d{4}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function isNew(createdAt?: string | null) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 15 * 24 * 60 * 60 * 1000;
}

export function FeaturedDevelopments() {
  const { data: items } = useSuspenseQuery({
    queryKey: ["featured-developments"],
    queryFn: () => getFeaturedDevelopments(),
  });

  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl text-foreground md:text-4xl">
              Empreendimentos em Destaque
            </h2>
            <p className="mt-4 font-body text-muted-foreground">
              Lançamentos e obras selecionados em Brasília/DF
            </p>
          </div>
          <Button asChild variant="outline-gold" size="lg">
            <Link to="/empreendimentos">Ver Todos</Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {items.length === 0
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : items.map((d, i) => (
                <DevelopmentCard
                  key={d.id}
                  dev={d}
                  fallbackImage={placeholders[i % placeholders.length]}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

function DevelopmentCard({
  dev,
  fallbackImage,
}: {
  dev: Development;
  fallbackImage: string;
}) {
  const price = formatPrice(dev.price_from);
  const forecast = formatForecast(dev.delivery_forecast);
  const isReady = (dev.status ?? "").toLowerCase() === "ready";
  const showNew = isNew(dev.created_at);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold">
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={dev.cover_image_url || fallbackImage}
          alt={dev.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {isReady ? (
            <span className="rounded-md bg-badge-green px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
              Pronta Entrega
            </span>
          ) : forecast ? (
            <span className="rounded-md bg-badge-blue px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
              Previsão {forecast}
            </span>
          ) : null}
          {showNew && (
            <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              Novo
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-xl text-foreground">{dev.name}</h3>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          {[dev.region, dev.builder].filter(Boolean).join(" · ") || "—"}
        </p>
        {price && (
          <p className="mt-4 font-body text-sm font-medium text-primary">
            A partir de {price}
          </p>
        )}
        <div className="mt-6 flex-1" />
        <Button asChild variant="outline-gold" size="sm" className="self-start">
          <Link to="/empreendimentos/$slug" params={{ slug: dev.slug }}>
            Ver Detalhes
          </Link>
        </Button>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="aspect-[16/9] animate-pulse bg-muted" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-9 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
