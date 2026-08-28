import { createFileRoute, notFound, useRouter, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { BedDouble, Car, ChevronLeft, ChevronRight, Home, Maximize, X } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  imageAlt,
  normalizeImages,
  pickCoverImage,
  type DevImage,
} from "@/lib/development-images";
import { pickPropCover } from "@/lib/property-images";
import { optimizedImageUrl } from "@/lib/image-url";
import { buildSeoTitle } from "@/lib/seo-title";
import { SubmittedState } from "@/components/contact/SubmittedState";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Route = createFileRoute("/empreendimentos/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("developments")
      .select("*, regions(name)")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return data as DevDetail;
  },
  head: ({ loaderData, params }) => {
    const url = `https://brunobarretoimoveis.com.br/empreendimentos/${params.slug}`;
    const cover = loaderData ? pickCoverImage(loaderData.images) : null;
    const ogImage = cover?.url ?? null;
    const title = loaderData
      ? buildSeoTitle({ title: loaderData.title, region: loaderData.regions?.name })
      : "Empreendimento | Bruno Barreto";
    const description = loaderData
      ? buildDevelopmentDescription(loaderData)
      : "Lançamentos e empreendimentos de alto padrão em Brasília/DF com a curadoria de Bruno Barreto, corretor imobiliário CRECI-DF 34.060.";

    const meta: { title?: string; name?: string; content?: string; property?: string }[] = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "Bruno Barreto Imóveis" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];

    if (ogImage) {
      meta.push(
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: title },
        { name: "twitter:image", content: ogImage },
      );
    }

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: loaderData?.title ?? titleFromSlug(params.slug),
            description,
            url,
            category: "Empreendimento",
            broker: {
              "@type": "RealEstateAgent",
              name: "Bruno Barreto Imóveis",
              telephone: "+5561999350888",
              areaServed: "Distrito Federal, Brasil",
            },
          }),
        },
      ],
    };
  },
  pendingMs: 300,
  pendingMinMs: 400,
  pendingComponent: DevelopmentDetailPending,
  notFoundComponent: DevelopmentDetailNotFound,
  errorComponent: DevelopmentDetailError,
  component: DevelopmentDetailPage,
});


type DevDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  builder: string | null;
  status: "pronta_entrega" | "previsao" | null;
  delivery_date: string | null;
  typology: string[] | null;
  price_from: number | null;
  price_to: number | null;
  area_from: number | null;
  area_to: number | null;
  images: unknown;
  video_url: string | null;
  virtual_tour_url: string | null;
  regions: { name: string } | null;
};

const GOLD = "#C9A84C";
const DARK = "#1a1a1a";
const BG = "#FAFAF8";
const WHATS = "#25D366";

const WHATSAPP_NUMBER = "5561999350888";

const CATEGORY_SECTIONS: { key: string; match: string[]; label: string }[] = [
  { key: "fachada", match: ["fachada"], label: "O Empreendimento" },
  { key: "area_comum", match: ["area_comum", "lazer"], label: "Lazer e Áreas Comuns" },
  { key: "apartamento", match: ["apartamento"], label: "Apartamento" },
  { key: "planta", match: ["planta"], label: "Plantas" },
  { key: "outros", match: ["outros"], label: "Galeria" },
];

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

function buildDevelopmentDescription(dev: DevDetail): string {
  const frags: string[] = [];

  if (dev.typology && dev.typology.length > 0) {
    frags.push(dev.typology.join(" e "));
  }
  if (dev.area_from != null && dev.area_to != null) {
    frags.push(
      dev.area_to !== dev.area_from
        ? `de ${dev.area_from} a ${dev.area_to} m²`
        : `${dev.area_from} m²`,
    );
  } else if (dev.area_from != null) {
    frags.push(`${dev.area_from} m²`);
  } else if (dev.area_to != null) {
    frags.push(`até ${dev.area_to} m²`);
  }
  if (dev.price_from != null) {
    frags.push(`a partir de ${formatPrice(dev.price_from)}`);
  }

  const delivery =
    dev.status === "pronta_entrega"
      ? "Pronta entrega"
      : dev.status === "previsao" && dev.delivery_date
        ? `Entrega prevista para ${formatDelivery(dev.delivery_date)}`
        : null;

  const brand = "Bruno Barreto, CRECI-DF 34.060.";
  const base = frags.length > 0 ? `${dev.title}: ${frags.join(", ")}.` : `${dev.title}.`;
  const middle = delivery ? ` ${delivery}.` : "";
  const result = `${base}${middle} ${brand}`;

  if (result.length <= 155) return result;

  // Trunca a primeira frase em palavra inteira, sem pontuação solta antes de "…"
  const suffix = `${middle} ${brand}`;
  const maxBase = 155 - suffix.length - 1; // 1 char para "…"
  let truncated = base.slice(0, Math.max(0, maxBase)).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
  truncated = truncated.replace(/[\s+\-,;:/&]+$/, "");
  return `${truncated}…${suffix}`.slice(0, 160);
}

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

interface ContactForm {
  name: string;
  whatsapp: string;
  message: string;
}

function DevelopmentDetailPending() {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="aspect-[16/10] w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </Layout>
  );
}

function DevelopmentDetailNotFound() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Empreendimento não encontrado</h1>
        <p className="mt-4 text-muted-foreground">
          O empreendimento que você procurou não está mais disponível ou o endereço está incorreto.
        </p>
        <Link
          to="/empreendimentos"
          className="mt-8 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Ver empreendimentos
        </Link>
      </div>
    </Layout>
  );
}

function DevelopmentDetailError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Erro ao carregar o empreendimento</h1>
        <p className="mt-4 text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-8 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </Layout>
  );
}

function DevelopmentDetailPage() {
  const dev = Route.useLoaderData();
  return <DevelopmentDetail dev={dev} />;
}

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

function DevelopmentDetail({ dev }: { dev: DevDetail }) {
  const allImages = normalizeImages(dev.images);
  const cover = pickCoverImage(allImages);
  const delivery = formatDelivery(dev.delivery_date);
  const youtubeId = dev.video_url ? getYouTubeId(dev.video_url) : null;

  const whatsappText = encodeURIComponent(
    `Olá! Tenho interesse no empreendimento ${dev.title}`,
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;

  const [lightbox, setLightbox] = useState<{ list: DevImage[]; index: number } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight")
        setLightbox((s) => (s ? { ...s, index: (s.index + 1) % s.list.length } : s));
      if (e.key === "ArrowLeft")
        setLightbox((s) =>
          s ? { ...s, index: (s.index - 1 + s.list.length) % s.list.length } : s,
        );
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const priceLabel = (() => {
    if (dev.price_from != null && dev.price_to != null && dev.price_to !== dev.price_from)
      return `de ${formatPrice(dev.price_from)} até ${formatPrice(dev.price_to)}`;
    if (dev.price_from != null) return formatPrice(dev.price_from);
    return null;
  })();

  const areaLabel = (() => {
    if (dev.area_from != null && dev.area_to != null && dev.area_to !== dev.area_from)
      return `${dev.area_from}m² – ${dev.area_to}m²`;
    if (dev.area_from != null) return `${dev.area_from}m²`;
    return null;
  })();

  const fichaItems: { label: string; value: string }[] = [];
  if (dev.regions?.name)
    fichaItems.push({ label: "Localização", value: `${dev.regions.name} – Brasília/DF` });
  if (priceLabel) fichaItems.push({ label: "Valor da Unidade", value: priceLabel });
  if (areaLabel) fichaItems.push({ label: "Área", value: areaLabel });
  if (dev.typology && dev.typology.length > 0)
    fichaItems.push({
      label: "Tipologia",
      value: `${dev.typology.join(" e ")} quartos`,
    });
  if (dev.status === "pronta_entrega")
    fichaItems.push({ label: "Entrega", value: "Pronta Entrega" });
  else if (delivery) fichaItems.push({ label: "Entrega", value: delivery });
  if (dev.builder) fichaItems.push({ label: "Construtora", value: dev.builder });

  const fade1 = useInViewFade<HTMLDivElement>();
  const fade2 = useInViewFade<HTMLDivElement>();
  const fade3 = useInViewFade<HTMLDivElement>();
  

  const statusLabel =
    dev.status === "pronta_entrega"
      ? "Pronta Entrega"
      : dev.status === "previsao" && delivery
        ? `Previsão ${delivery}`
        : null;

  return (
    <Layout>
      {/* 1. HERO */}
      <section
        className="relative w-full"
        style={{ height: "70vh", backgroundColor: DARK }}
      >
        {cover && (
          <img
            src={optimizedImageUrl(cover.url, { width: 1600, quality: 80 })}
            alt={dev.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col gap-4"
          style={{ padding: "40px 5%" }}
        >
          {statusLabel && (
            <span
              className="inline-block self-start"
              style={{
                border: `1px solid ${GOLD}`,
                color: "#fff",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "6px 14px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {statusLabel}
            </span>
          )}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {dev.title}
          </h1>
          {dev.regions?.name && (
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
              }}
            >
              {dev.regions.name} • Brasília/DF
            </p>
          )}
        </div>
      </section>

      {/* 2. FICHA RESUMO */}
      <section style={{ backgroundColor: "#fff", padding: "40px 5%" }}>
        <div className="mx-auto max-w-3xl">
          <dl className="divide-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            {fichaItems.map((it) => (
              <div
                key={it.label}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <dt
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "#888",
                  }}
                >
                  {it.label}
                </dt>
                <dd
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: DARK,
                    margin: 0,
                  }}
                >
                  {it.value}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center rounded-sm sm:w-auto"
            style={{
              backgroundColor: WHATS,
              color: "#fff",
              padding: "14px 28px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            💬 Falar com o corretor
          </a>
        </div>
      </section>

      {/* 3. GALERIAS POR CATEGORIA */}
      {CATEGORY_SECTIONS.map((sec, idx) => {
        const list = allImages.filter((img) => sec.match.includes(img.category));
        if (list.length === 0) return null;
        const bg = idx % 2 === 0 ? BG : "#fff";
        return (
          <CategorySection
            key={sec.key}
            title={sec.label}
            images={list}
            bg={bg}
            developmentTitle={dev.title}
            onOpen={(i) => setLightbox({ list, index: i })}
          />
        );
      })}

      {/* 4. SOBRE */}
      {dev.description && (
        <section style={{ backgroundColor: BG, padding: "60px 5%" }}>
          <div ref={fade1.ref} style={fade1.style} className="mx-auto max-w-3xl">
            <SectionHeading>Sobre o Empreendimento</SectionHeading>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 17,
                color: "#555",
                lineHeight: 1.85,
                maxWidth: 720,
                whiteSpace: "pre-line",
                marginTop: 16,
              }}
            >
              {dev.description}
            </p>
          </div>
        </section>
      )}

      {/* 5. IMÓVEIS VINCULADOS */}
      <LinkedPropertiesCarousel developmentId={dev.id} />

      {/* 6. VÍDEO */}
      {youtubeId && (
        <section style={{ backgroundColor: DARK, padding: "64px 5%" }}>
          <div ref={fade2.ref} style={fade2.style} className="mx-auto" >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 32,
                color: "#fff",
                textAlign: "center",
                margin: 0,
              }}
            >
              Conheça o Empreendimento
            </h2>
            <div
              className="mt-8 mx-auto aspect-video w-full overflow-hidden rounded-sm"
              style={{ maxWidth: 860 }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`Vídeo - ${dev.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* 7. FORMULÁRIO */}
      <section style={{ backgroundColor: DARK, padding: "64px 5%" }}>
        <div
          ref={fade3.ref}
          style={fade3.style}
          className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:gap-16"
        >
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(26px, 4vw, 34px)",
                color: "#fff",
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Tenho interesse neste empreendimento
            </h2>
            <p
              className="mt-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.6,
              }}
            >
              Deixe seu contato e Bruno retorna pessoalmente para apresentar as
              melhores oportunidades.
            </p>
          </div>
          <ContactForm developmentId={dev.id} />
        </div>
      </section>

      {/* 8. WHATSAPP FIXO MOBILE */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        style={{
          backgroundColor: WHATS,
          color: "#fff",
          padding: "16px",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        💬 Falar no WhatsApp
      </a>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute right-5 top-5 text-white"
            aria-label="Fechar"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((s) =>
                s
                  ? { ...s, index: (s.index - 1 + s.list.length) % s.list.length }
                  : s,
              );
            }}
            className="absolute left-3 sm:left-6 text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img
            src={optimizedImageUrl(lightbox.list[lightbox.index].url, { width: 1920, quality: 82 })}
            alt={imageAlt(
              lightbox.list[lightbox.index],
              dev.title,
              lightbox.list
                .slice(0, lightbox.index + 1)
                .filter((x) => x.category === lightbox.list[lightbox.index].category).length,
              lightbox.list.filter((x) => x.category === lightbox.list[lightbox.index].category)
                .length,
            )}
            className="max-h-[90vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((s) =>
                s ? { ...s, index: (s.index + 1) % s.list.length } : s,
              );
            }}
            className="absolute right-3 sm:right-6 text-white"
            aria-label="Próxima"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </div>
      )}
    </Layout>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          color: DARK,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {children}
      </h2>
      <div
        style={{
          width: 40,
          height: 2,
          backgroundColor: GOLD,
          margin: "10px 0 20px",
        }}
      />
    </div>
  );
}

function CategorySection({
  title,
  images,
  bg,
  developmentTitle,
  onOpen,
}: {
  title: string;
  images: DevImage[];
  bg: string;
  developmentTitle: string;
  onOpen: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fade = useInViewFade<HTMLDivElement>();

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section style={{ backgroundColor: bg, padding: "48px 5%" }}>
      <div ref={fade.ref} style={fade.style} className="mx-auto max-w-6xl">
        <SectionHeading>{title}</SectionHeading>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
            }}
          >
            {images.map((img, i) => {
              const catCount = images.filter((x) => x.category === img.category).length;
              const catPos =
                images.slice(0, i + 1).filter((x) => x.category === img.category).length;
              return (
              <button
                key={i}
                type="button"
                onClick={() => onOpen(i)}
                className="relative shrink-0 overflow-hidden"
                style={{
                  width: 340,
                  height: 240,
                  borderRadius: 2,
                  scrollSnapAlign: "start",
                }}
              >
                <img
                  src={optimizedImageUrl(img.url, { width: 700, quality: 75 })}
                  alt={imageAlt(img, developmentTitle, catPos, catCount)}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
              );
            })}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center md:flex"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  marginLeft: -10,
                }}
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: DARK }} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                className="absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center md:flex"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  marginRight: -10,
                }}
                aria-label="Próxima"
              >
                <ChevronRight className="h-5 w-5" style={{ color: DARK }} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ContactForm({ developmentId }: { developmentId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    defaultValues: { name: "", whatsapp: "", message: "" },
  });

  const onSubmit = async (values: ContactForm) => {
    const { error } = await supabase.from("leads").insert({
      name: values.name.trim(),
      phone: values.whatsapp.trim() || null,
      message: values.message.trim() || null,
      development_id: developmentId,
      source: "empreendimento",
    });

    if (error) {
      console.error("Lead insert error:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      return;
    }

    toast.success("Mensagem enviada!", {
      description:
        "Parabéns, você está a um passo de adquirir seu novo imóvel. Em breve nossa equipe entrará em contato para te atender.",
    });
    reset();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SubmittedState
        onReset={() => {
          reset();
          setSubmitted(false);
        }}
      />
    );
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "12px 14px",
    fontFamily: "Inter, sans-serif",
    fontSize: 15,
    width: "100%",
    borderRadius: 2,
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <input
          placeholder="Nome *"
          {...register("name", {
            required: "Informe seu nome",
            maxLength: { value: 100, message: "Máximo 100 caracteres" },
          })}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")
          }
        />
        {errors.name && (
          <p className="mt-1 text-xs" style={{ color: "#ff8a8a" }}>
            {errors.name.message}
          </p>
        )}
      </div>
      <input
        placeholder="WhatsApp"
        type="tel"
        {...register("whatsapp", { maxLength: 30 })}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")
        }
      />
      <textarea
        placeholder="Mensagem (opcional)"
        rows={4}
        {...register("message", { maxLength: 1000 })}
        style={{ ...inputStyle, resize: "vertical" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")
        }
      />
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          backgroundColor: GOLD,
          color: DARK,
          padding: "14px 28px",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: 0.5,
          border: "none",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.7 : 1,
          borderRadius: 2,
        }}
      >
        {isSubmitting ? "Enviando..." : "Quero ser Contactado"}
      </button>
    </form>
  );
}

type LinkedProperty = {
  id: string;
  slug: string;
  title: string;
  type: string | null;
  purpose: string | null;
  price: number | null;
  bedrooms: number | null;
  parking_spots: number | null;
  area: number | null;
  built_area: number | null;
  useful_area: number | null;
  images: unknown;
  regions: { name: string } | null;
};

function LinkedPropertiesCarousel({ developmentId }: { developmentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["linked-properties", developmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, regions(name)")
        .eq("development_id", developmentId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LinkedProperty[];
    },
    enabled: !!developmentId,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <section style={{ backgroundColor: "#fff", padding: "64px 5%" }}>
        <div className="mx-auto max-w-6xl">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: GOLD,
              margin: 0,
            }}
          >
            Disponíveis neste empreendimento
          </p>
          <SectionHeading>Imóveis para você</SectionHeading>
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="shrink-0 animate-pulse"
                style={{
                  width: 320,
                  height: 360,
                  backgroundColor: "#eee",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section style={{ backgroundColor: "#fff", padding: "64px 5%" }}>
      <div className="mx-auto max-w-6xl animate-fade-in">
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: GOLD,
            margin: 0,
          }}
        >
          Disponíveis neste empreendimento
        </p>
        <SectionHeading>Imóveis para você</SectionHeading>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
            }}
          >
            {data.map((p) => (
              <LinkedPropertyCard key={p.id} property={p} />
            ))}
          </div>
          {data.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center md:flex"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  marginLeft: -10,
                }}
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: DARK }} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                className="absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center md:flex"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  marginRight: -10,
                }}
                aria-label="Próxima"
              >
                <ChevronRight className="h-5 w-5" style={{ color: DARK }} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function LinkedPropertyCard({ property: p }: { property: LinkedProperty }) {
  const cover = pickPropCover(p.images, p.type)?.url;
  const area = p.useful_area ?? p.built_area ?? p.area ?? null;
  const region = p.regions?.name ?? "Brasília/DF";
  const isTerreno = p.type === "terreno";
  const typeLabel = p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "Imóvel";
  const purposeLabel = p.purpose === "aluguel" ? "Locação" : "Venda";

  return (
    <Link
      to="/imoveis/$slug"
      params={{ slug: p.slug }}
      className="group shrink-0 overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1"
      style={{
        width: 320,
        scrollSnapAlign: "start",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 200, backgroundColor: "#f0f0f0" }}
      >
        {cover ? (
          <img
            src={optimizedImageUrl(cover, { width: 500, quality: 72 })}
            alt={p.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home className="h-10 w-10" style={{ color: "#bbb" }} />
          </div>
        )}
        <span
          className="absolute left-3 top-3"
          style={{
            backgroundColor: GOLD,
            color: DARK,
            fontFamily: "Inter, sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            padding: "5px 10px",
            borderRadius: 2,
          }}
        >
          {purposeLabel}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: "#888",
            margin: 0,
          }}
        >
          {typeLabel} · {region}
        </p>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            color: DARK,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {p.title}
        </h3>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: GOLD,
            margin: 0,
          }}
        >
          {p.price != null
            ? `${formatPrice(p.price)}${p.purpose === "aluguel" ? "/mês" : ""}`
            : "Consulte o valor"}
        </p>
        {(p.bedrooms || p.parking_spots || area) && (
          <div
            className="flex flex-wrap items-center gap-3 pt-2"
            style={{
              borderTop: "1px solid rgba(0,0,0,0.06)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              color: "#888",
            }}
          >
            {!isTerreno && p.bedrooms ? (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />
                {p.bedrooms}
              </span>
            ) : null}
            {!isTerreno && p.parking_spots ? (
              <span className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {p.parking_spots}
              </span>
            ) : null}
            {area ? (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {area}m²
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
}
