import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/empreendimentos")({
  component: EmpreendimentosPage,
});

type DevRow = {
  id: string;
  slug: string;
  title: string;
  typology: string[] | null;
  images: string[] | null;
  status: "pronta_entrega" | "previsao" | null;
  delivery_date: string | null;
  price_from: number | null;
  regions: { name: string } | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDelivery(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function EmpreendimentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["developments", "all-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("*, regions(name)")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DevRow[];
    },
  });

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="font-heading text-4xl text-foreground">Empreendimentos</h1>
        <p className="mt-3 font-body text-muted-foreground">
          Lançamentos selecionados com olhar de arquiteto.
        </p>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <p className="py-20 text-center font-body text-muted-foreground">
              Nenhum empreendimento disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((d) => (
                <Card key={d.id} dev={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Card({ dev }: { dev: DevRow }) {
  const cover = dev.images?.[0];
  const delivery = formatDelivery(dev.delivery_date);
  return (
    <a
      href={`/empreendimentos/${dev.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {cover ? (
          <img
            src={cover}
            alt={dev.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}
        <div className="absolute left-3 top-3">
          {dev.status === "pronta_entrega" ? (
            <span className="rounded-md bg-badge-green px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
              Pronta Entrega
            </span>
          ) : dev.status === "previsao" && delivery ? (
            <span className="rounded-md bg-badge-blue px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
              Previsão {delivery}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-xl text-foreground">{dev.title}</h3>
        {dev.regions?.name && (
          <p className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {dev.regions.name}
          </p>
        )}
        {dev.typology && dev.typology.length > 0 && (
          <p className="font-body text-sm text-muted-foreground">
            {dev.typology.join(" • ")}
          </p>
        )}
        {dev.price_from != null && (
          <p className="mt-auto pt-2 font-body text-base font-medium text-primary">
            A partir de {formatPrice(dev.price_from)}
          </p>
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
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
