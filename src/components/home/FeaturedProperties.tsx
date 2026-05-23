import { Link } from "@tanstack/react-router";
import { BedDouble, Car, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

type Purpose = "sale" | "rent";
type Status = "available" | "reserved";

type Property = {
  id: string;
  title: string;
  type: string;
  region: string;
  purpose: Purpose;
  price: number;
  bedrooms: number;
  parking: number;
  area_sqm: number;
  status: Status;
};

const MOCK: Property[] = [
  {
    id: "1",
    title: "Apartamento 3 quartos — Asa Sul",
    type: "Apartamento",
    region: "Asa Sul, Brasília/DF",
    purpose: "sale",
    price: 850000,
    bedrooms: 3,
    parking: 2,
    area_sqm: 110,
    status: "available",
  },
  {
    id: "2",
    title: "Casa em Condomínio — Park Sul",
    type: "Casa em Condomínio",
    region: "Park Sul, Brasília/DF",
    purpose: "sale",
    price: 1200000,
    bedrooms: 4,
    parking: 3,
    area_sqm: 220,
    status: "available",
  },
  {
    id: "3",
    title: "Apartamento 2 quartos — Taguatinga",
    type: "Apartamento",
    region: "Taguatinga, Brasília/DF",
    purpose: "rent",
    price: 2800,
    bedrooms: 2,
    parking: 1,
    area_sqm: 68,
    status: "available",
  },
  {
    id: "4",
    title: "Cobertura Duplex — Águas Claras",
    type: "Cobertura Duplex",
    region: "Águas Claras, Brasília/DF",
    purpose: "sale",
    price: 1650000,
    bedrooms: 4,
    parking: 3,
    area_sqm: 280,
    status: "reserved",
  },
];

function formatPrice(value: number, purpose: Purpose) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
  return purpose === "rent" ? `${formatted}/mês` : formatted;
}

export function FeaturedProperties() {
  return (
    <section className="bg-background py-24 md:py-32">
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

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {MOCK.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PropertyCard({ property: p }: { property: Property }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-gold">
      <div className="relative aspect-video w-full bg-muted">
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            {p.purpose === "sale" ? "Venda" : "Aluguel"}
          </span>
          {p.status === "reserved" && (
            <span className="rounded-md bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
              Reservado
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        <p className="font-body text-sm text-muted-foreground">
          {p.type} · {p.region}
        </p>
        <h3 className="font-heading text-2xl text-foreground">{p.title}</h3>
        <p className="font-body text-lg font-medium text-primary">
          {formatPrice(p.price, p.purpose)}
        </p>

        <div className="flex flex-wrap items-center gap-5 border-t border-border pt-4 text-muted-foreground">
          <span className="flex items-center gap-2 font-body text-sm">
            <BedDouble className="h-4 w-4" />
            {p.bedrooms} {p.bedrooms === 1 ? "quarto" : "quartos"}
          </span>
          <span className="flex items-center gap-2 font-body text-sm">
            <Car className="h-4 w-4" />
            {p.parking} {p.parking === 1 ? "vaga" : "vagas"}
          </span>
          <span className="flex items-center gap-2 font-body text-sm">
            <Maximize className="h-4 w-4" />
            {p.area_sqm} m²
          </span>
        </div>

        <div className="mt-2">
          <Button asChild variant="outline-gold" size="lg">
            <a href={`/imoveis/${p.id}`}>Ver Imóvel</a>
          </Button>
        </div>
      </div>
    </article>
  );
}
