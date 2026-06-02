import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { optimizedImageUrl } from "@/lib/image-url";
import { pickCoverImage } from "@/lib/development-images";

type DevRow = {
  id: string;
  slug: string;
  title: string;
  builder: string | null;
  typology: string[] | null;
  images: unknown;
  status: "pronta_entrega" | "previsao" | null;
  delivery_date: string | null;
  price_from: number | null;
  regions: { name: string } | null;
};

type Slide = {
  id: string;
  slug: string;
  name: string;
  region: string;
  builder: string;
  typology: string;
  cover_image_url: string | null;
  status: "ready" | "forecast" | null;
  delivery_forecast?: string;
  price_from: number | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDelivery(date: string | null) {
  if (!date) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function mapRow(d: DevRow): Slide {
  return {
    id: d.id,
    slug: d.slug,
    name: d.title,
    region: d.regions?.name ?? "",
    builder: d.builder ?? "",
    typology: d.typology?.join(" • ") ?? "",
    cover_image_url: pickCoverImage(d.images)?.url ?? null,
    status: d.status === "pronta_entrega" ? "ready" : d.status === "previsao" ? "forecast" : null,
    delivery_forecast: formatDelivery(d.delivery_date),
    price_from: d.price_from,
  };
}

export function FeaturedDevelopments() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "featured-developments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("*, regions(name)")
        .eq("active", true)
        .eq("featured", true)
        .order("featured_order");
      if (error) throw error;
      return (data as DevRow[]).map(mapRow);
    },
  });

  const items = data ?? [];
  const [index, setIndex] = useState(0);
  const total = items.length;
  const current = items[index % Math.max(total, 1)];

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-heading text-3xl text-foreground md:text-4xl">
            Empreendimentos em Destaque
          </h2>
          <Button asChild variant="outline-gold" size="lg">
            <Link to="/empreendimentos">Ver Todos</Link>
          </Button>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          {isLoading ? (
            <SlideSkeleton />
          ) : total === 0 ? (
            <div className="flex h-[320px] items-center justify-center p-8 text-center font-body text-muted-foreground md:h-[480px]">
              Nenhum empreendimento disponível no momento.
            </div>
          ) : (
            <Slide dev={current} />
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

function Slide({ dev }: { dev: Slide }) {
  return (
    <div className="grid animate-in fade-in duration-300 md:grid-cols-[55%_45%]">
      <div className="relative h-[320px] overflow-hidden bg-muted md:h-[480px]">
        {dev.cover_image_url ? (
          <img src={optimizedImageUrl(dev.cover_image_url, { width: 1400, quality: 78 })} alt={dev.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}
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
        {dev.typology && <p className="font-body text-muted-foreground">{dev.typology}</p>}
        {dev.price_from != null && (
          <p className="font-body text-xl font-medium text-primary">
            A partir de {formatPrice(dev.price_from)}
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
