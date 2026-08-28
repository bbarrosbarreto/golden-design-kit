import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bed, Home, MapPin, Maximize, Car } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { pickPropCover } from "@/lib/property-images";
import { optimizedImageUrl } from "@/lib/image-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TITLE = "Imóveis à venda em Brasília/DF | Bruno Barreto";
const DESCRIPTION =
  "Apartamentos, casas e terrenos disponíveis no Distrito Federal, com filtros por tipo, região e quartos. Curadoria de alto padrão de Bruno Barreto.";
const PAGE_URL = "https://brunobarretoimoveis.com.br/imoveis";

export const Route = createFileRoute("/imoveis/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: ImoveisIndexPage,
});


type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  type: "apartamento" | "casa" | "terreno" | string;
  purpose: "venda" | "aluguel" | string | null;
  price: number | null;
  bedrooms: number | null;
  parking_spots: number | null;
  area: number | null;
  built_area: number | null;
  useful_area: number | null;
  images: unknown;
  regions: { name: string } | null;
  developments: { title: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function ImoveisIndexPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, regions(name), developments(title)")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PropertyRow[];
    },
  });

  const regions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.forEach((p) => {
      if (p.regions?.name) set.add(p.regions.name);
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (purposeFilter !== "all" && p.purpose !== purposeFilter) return false;
      if (regionFilter !== "all" && p.regions?.name !== regionFilter) return false;
      return true;
    });
  }, [data, typeFilter, purposeFilter, regionFilter]);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="font-heading text-4xl text-foreground">Imóveis</h1>
        <p className="mt-3 font-body text-muted-foreground">
          Apartamentos, casas e terrenos selecionados com olhar de arquiteto.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger aria-label="Filtrar por tipo de imóvel">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
            </SelectContent>
          </Select>
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger aria-label="Filtrar por finalidade">
              <SelectValue placeholder="Finalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as finalidades</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger aria-label="Filtrar por região">
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as regiões</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center font-body text-muted-foreground">
              Nenhum imóvel encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <Card key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Card({ property }: { property: PropertyRow }) {
  const cover = pickPropCover(property.images, property.type)?.url;
  const typeLabel = TYPE_LABELS[property.type] ?? property.type;
  const area =
    property.useful_area ?? property.built_area ?? property.area ?? null;
  const isTerreno = property.type === "terreno";

  return (
    <a
      href={`/imoveis/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {cover ? (
          <img
            src={optimizedImageUrl(cover, { width: 800, quality: 75 })}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <Home className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
          {typeLabel}
        </span>
        {property.purpose === "venda" && (
          <span className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            Venda
          </span>
        )}
        {property.purpose === "aluguel" && (
          <span className="absolute right-3 top-3 rounded-md bg-badge-blue px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-background">
            Aluguel
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {property.regions?.name && (
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {property.regions.name}
          </p>
        )}
        <h2 className="font-body text-base font-semibold text-foreground">
          {property.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm text-muted-foreground">
          {!isTerreno && property.bedrooms ? (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.bedrooms}
            </span>
          ) : null}
          {area ? (
            <span className="inline-flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" />
              {area} m²
            </span>
          ) : null}
          {!isTerreno && property.parking_spots ? (
            <span className="inline-flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              {property.parking_spots}
            </span>
          ) : null}
        </div>

        <p className="mt-auto pt-2 font-body text-lg font-bold text-primary">
          {property.price != null ? formatPrice(property.price) : "Consulte o valor"}
        </p>

        {property.developments?.title && (
          <span className="inline-flex w-fit items-center gap-1 rounded-md border border-primary px-2 py-0.5 text-[11px] text-primary">
            <MapPin className="h-3 w-3" />
            {property.developments.title}
          </span>
        )}
      </div>
    </a>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
