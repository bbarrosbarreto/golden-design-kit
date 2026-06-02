import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Car, Maximize, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pickPropCover } from "@/lib/property-images";
import { optimizedImageUrl } from "@/lib/image-url";

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  type: string;
  purpose: string | null;
  price: number | null;
  bedrooms: number | null;
  parking_spots: number | null;
  area: number | null;
  built_area: number | null;
  useful_area: number | null;
  status: string | null;
  images: unknown;
  regions: { name: string } | null;
};

function formatPrice(value: number, purpose: string | null) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
  return purpose === "aluguel" ? `${formatted}/mês` : formatted;
}

export function FeaturedProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, regions(name)")
        .eq("featured", true)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as PropertyRow[];
    },
  });

  const items = data ?? [];
  const total = items.length;
  const [index, setIndex] = useState(0);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);
  const safeIndex = total > 0 ? index % total : 0;

  if (!isLoading && total === 0) return null;

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-3xl text-foreground md:text-4xl">
              Anúncios em Destaque
            </h2>
            <p className="font-body text-muted-foreground">
              Imóveis selecionados para venda e locação
            </p>
          </div>
          <Button asChild variant="outline-gold" size="lg">
            <Link to="/imoveis">Ver Todos</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="aspect-video animate-pulse rounded-lg bg-muted" />
            <div className="aspect-video animate-pulse rounded-lg bg-muted" />
          </div>
        ) : (
          <>
            <div className="relative mt-12">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                >
                  {items.map((p) => (
                    <div key={p.id} className="w-full shrink-0 px-2 md:w-1/2">
                      <PropertyCard property={p} />
                    </div>
                  ))}
                </div>
              </div>

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Anterior"
                    className="absolute -left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background md:-left-5"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Próximo"
                    className="absolute -right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background md:-right-5"
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
                      i === safeIndex ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PropertyCard({ property: p }: { property: PropertyRow }) {
  const cover = pickPropCover(p.images, p.type)?.url;
  const area = p.useful_area ?? p.built_area ?? p.area ?? null;
  const region = p.regions?.name ?? "Brasília/DF";
  const isReserved = p.status === "reserved" || p.status === "reservado";
  const isTerreno = p.type === "terreno";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-gold">
      <div className="relative aspect-video w-full overflow-hidden bg-surface">
        {cover ? (
          <img
            src={optimizedImageUrl(cover, { width: 800, quality: 75 })}
            alt={p.title}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            {p.purpose === "aluguel" ? "Aluguel" : "Venda"}
          </span>
          {isReserved && (
            <span className="rounded-md bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
              Reservado
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        <p className="font-body text-sm text-muted-foreground">
          {p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "Imóvel"} · {region}
        </p>
        <h3 className="font-heading text-2xl text-foreground">{p.title}</h3>
        <p className="font-body text-lg font-medium text-primary">
          {p.price != null ? formatPrice(p.price, p.purpose) : "Consulte o valor"}
        </p>

        <div className="flex flex-wrap items-center gap-5 border-t border-border pt-4 text-muted-foreground">
          {!isTerreno && p.bedrooms ? (
            <span className="flex items-center gap-2 font-body text-sm">
              <BedDouble className="h-4 w-4" />
              {p.bedrooms} {p.bedrooms === 1 ? "quarto" : "quartos"}
            </span>
          ) : null}
          {!isTerreno && p.parking_spots ? (
            <span className="flex items-center gap-2 font-body text-sm">
              <Car className="h-4 w-4" />
              {p.parking_spots} {p.parking_spots === 1 ? "vaga" : "vagas"}
            </span>
          ) : null}
          {area ? (
            <span className="flex items-center gap-2 font-body text-sm">
              <Maximize className="h-4 w-4" />
              {area} m²
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-2">
          <Button asChild variant="outline-gold" size="lg">
            <Link to="/imoveis/$slug" params={{ slug: p.slug }}>Ver Imóvel</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
