import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  groupImagesByCategory,
  imageAlt,
  normalizePropImages,
  pickPropCover,
  sectionLabel,
  type PropImage,
  type PropertyType,
} from "@/lib/property-images";
import { optimizedImageUrl } from "@/lib/image-url";
import { SubmittedState } from "@/components/contact/SubmittedState";

const WHATSAPP_NUMBER = "5561999350888";

const TYPE_LABEL: Record<PropertyType, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

type PropertyDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: PropertyType;
  purpose: "venda" | "aluguel" | null;
  price: number | null;
  address: string | null;
  area: number | null;
  useful_area: number | null;
  built_area: number | null;
  green_area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  images: unknown;
  image_category_order: unknown;
  video_url: string | null;
  regions: { name: string } | null;
  developments: { id: string; title: string; slug: string } | null;
};

function buildTitle(prop: PropertyDetail, slug: string): string {
  const region = prop.regions?.name;
  const suffix = " | Bruno Barreto Imóveis";
  const connector = region ? ` | ${region}` : "";
  const full = `${prop.title}${connector}${suffix}`;
  if (full.length <= 60) return full;
  const reserved = `${connector}${suffix}`.length;
  const maxTitle = 60 - reserved - 1;
  return `${prop.title.slice(0, Math.max(0, maxTitle)).trimEnd()}…${connector}${suffix}`;
}

function buildPropertyDescription(prop: PropertyDetail): string {
  const type = TYPE_LABEL[prop.type];
  const purpose = prop.purpose === "aluguel" ? "para alugar" : "à venda";
  const region = prop.regions?.name;
  const parts: string[] = [];

  parts.push(`${type} ${purpose}${region ? ` em ${region}` : ""}`);

  if (prop.bedrooms != null && prop.type !== "terreno") {
    parts.push(`${prop.bedrooms} quarto${prop.bedrooms > 1 ? "s" : ""}`);
  }
  if (prop.suites != null && prop.suites > 0 && prop.type !== "terreno") {
    parts.push(`${prop.suites} suíte${prop.suites > 1 ? "s" : ""}`);
  }
  if (prop.bathrooms != null && prop.bathrooms > 0 && prop.type !== "terreno") {
    parts.push(`${prop.bathrooms} banheiro${prop.bathrooms > 1 ? "s" : ""}`);
  }
  const area = prop.useful_area ?? prop.area;
  if (area != null) parts.push(`${area} m²`);
  if (prop.parking_spots != null && prop.parking_spots > 0) {
    parts.push(`${prop.parking_spots} vaga${prop.parking_spots > 1 ? "s" : ""}`);
  }
  parts.push(prop.price != null ? formatPrice(prop.price) : "Valor sob consulta");

  const base = parts.join(", ") + ".";
  const suffix = " Fale com Bruno Barreto, CRECI-DF 34.060.";
  const available = 155 - suffix.length;
  if (base.length <= available) return base + suffix;
  return base.slice(0, Math.max(0, available - 1)).trimEnd() + "…" + suffix;
}

export const Route = createFileRoute("/imoveis/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("properties")
      .select("*, regions(name), developments(id, title, slug)")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return data as PropertyDetail;
  },
  head: ({ loaderData, params }) => {
    const url = `https://brunobarretoimoveis.com.br/imoveis/${params.slug}`;
    const cover = loaderData ? pickPropCover(loaderData.images, loaderData.type) : null;
    const ogImage = cover?.url ? cover.url : null;
    const title = loaderData
      ? buildTitle(loaderData, params.slug)
      : "Imóvel | Bruno Barreto Imóveis";
    const description = loaderData
      ? buildPropertyDescription(loaderData)
      : "Imóveis de alto padrão em Brasília/DF com a curadoria de Bruno Barreto, corretor imobiliário CRECI-DF 34.060.";

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
            category: "Imóvel",
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
  pendingComponent: PropertyDetailPending,
  notFoundComponent: PropertyDetailNotFound,
  errorComponent: PropertyDetailError,
  component: PropertyDetailPage,
});

function PropertyDetailPending() {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="aspect-[16/10] w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </Layout>
  );
}

function PropertyDetailNotFound() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Imóvel não encontrado</h1>
        <p className="mt-4 text-muted-foreground">
          O imóvel que você procurou não está mais disponível ou o endereço está incorreto.
        </p>
        <Link
          to="/imoveis"
          className="mt-8 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Ver imóveis disponíveis
        </Link>
      </div>
    </Layout>
  );
}

function PropertyDetailError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Erro ao carregar o imóvel</h1>
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

function PropertyDetailPage() {
  const prop = Route.useLoaderData();
  return <PropertyDetail prop={prop} />;
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

function PropertyDetail({ prop }: { prop: PropertyDetail }) {
  const allImages = normalizePropImages(prop.images, prop.type);
  const cover = pickPropCover(prop.images, prop.type);
  const youtubeId = prop.video_url ? getYouTubeId(prop.video_url) : null;
  const isTerreno = prop.type === "terreno";
  const isCasa = prop.type === "casa";

  const whatsappText = encodeURIComponent(`Olá! Tenho interesse no imóvel ${prop.title}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;

  const [lightbox, setLightbox] = useState<{ list: PropImage[]; index: number } | null>(null);

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

  const usefulArea = prop.useful_area ?? prop.area;
  const showTotalArea =
    (isCasa || isTerreno) && prop.area != null && prop.area !== usefulArea;

  const localizacao =
    prop.address ??
    (prop.regions?.name ? `${prop.regions.name}, Brasília/DF` : null);

  type FichaItem = { label: string; value: React.ReactNode };
  const ficha: FichaItem[] = [];
  if (localizacao) ficha.push({ label: "Localização", value: localizacao });
  ficha.push({
    label: "Preço",
    value: prop.price != null ? formatPrice(prop.price) : "Consulte o valor",
  });
  if (usefulArea != null) ficha.push({ label: "Área", value: `${usefulArea} m²` });
  if (showTotalArea && prop.area != null)
    ficha.push({ label: "Área Total", value: `${prop.area} m²` });
  if (isCasa && prop.built_area != null)
    ficha.push({ label: "Área Construída", value: `${prop.built_area} m²` });
  if (!isTerreno && prop.green_area != null && isCasa)
    ficha.push({ label: "Área Verde", value: `${prop.green_area} m²` });
  if (isTerreno && prop.green_area != null)
    ficha.push({ label: "Área Verde", value: `${prop.green_area} m²` });
  if (!isTerreno && prop.bedrooms != null)
    ficha.push({ label: "Quartos", value: prop.bedrooms });
  if (!isTerreno && prop.suites != null && prop.suites > 0)
    ficha.push({ label: "Suítes", value: prop.suites });
  if (!isTerreno && prop.bathrooms != null && prop.bathrooms > 0)
    ficha.push({ label: "Banheiros", value: prop.bathrooms });
  if (prop.parking_spots != null && prop.parking_spots > 0)
    ficha.push({ label: "Vagas", value: prop.parking_spots });
  if (prop.developments)
    ficha.push({
      label: "Empreendimento",
      value: (
        <Link
          to="/empreendimentos/$slug"
          params={{ slug: prop.developments.slug }}
          style={{ color: GOLD, textDecoration: "underline" }}
        >
          {prop.developments.title}
        </Link>
      ),
    });

  const groups = groupImagesByCategory(allImages, prop.type, prop.image_category_order);


  const fade1 = useInViewFade<HTMLDivElement>();
  const fade2 = useInViewFade<HTMLDivElement>();
  const fade3 = useInViewFade<HTMLDivElement>();

  const purposeLabel = prop.purpose === "aluguel" ? "Aluguel" : "Venda";

  return (
    <Layout>
      {/* 1. HERO */}
      <section className="relative w-full" style={{ height: "70vh", backgroundColor: DARK }}>
        {cover && (
          <img
            src={optimizedImageUrl(cover.url, { width: 1600, quality: 80 })}
            alt={prop.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col gap-4"
          style={{ padding: "40px 5%" }}
        >
          <div className="flex flex-wrap gap-2">
            <span
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
              {TYPE_LABEL[prop.type]}
            </span>
            <span
              style={{
                backgroundColor: GOLD,
                color: DARK,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "6px 14px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
              }}
            >
              {purposeLabel}
            </span>
          </div>
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
            {prop.title}
          </h1>
          {prop.regions?.name && (
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
              }}
            >
              {prop.regions.name} • Brasília/DF
            </p>
          )}
        </div>
      </section>

      {/* 2. FICHA RESUMO */}
      <section style={{ backgroundColor: "#fff", padding: "40px 5%" }}>
        <div className="mx-auto max-w-3xl">
          <dl className="divide-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            {ficha.map((it, i) => (
              <div
                key={i}
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
      {groups.map((group, idx) => {
        const bg = idx % 2 === 0 ? BG : "#fff";
        return (
          <CategorySection
            key={group.category}
            title={sectionLabel(group.category, prop.type)}
            images={group.images}
            bg={bg}
            onOpen={(i) => setLightbox({ list: group.images, index: i })}
          />
        );
      })}

      {/* 4. SOBRE */}
      {prop.description && (
        <section style={{ backgroundColor: BG, padding: "60px 5%" }}>
          <div ref={fade1.ref} style={fade1.style} className="mx-auto max-w-3xl">
            <SectionHeading size={30}>Sobre o Imóvel</SectionHeading>
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
              {prop.description}
            </p>
          </div>
        </section>
      )}

      {/* 5. VÍDEO */}
      {youtubeId && (
        <section style={{ backgroundColor: DARK, padding: "64px 5%" }}>
          <div ref={fade2.ref} style={fade2.style} className="mx-auto">
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 32,
                color: "#fff",
                textAlign: "center",
                margin: 0,
              }}
            >
              Conheça o Imóvel
            </h2>
            <div
              className="mt-8 mx-auto aspect-video w-full overflow-hidden rounded-sm"
              style={{ maxWidth: 860 }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`Vídeo - ${prop.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* 6. FORMULÁRIO */}
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
              Tenho interesse neste imóvel
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
              Deixe seu contato e Bruno retorna pessoalmente para apresentar este imóvel.
            </p>
          </div>
          <PropertyContactForm propertyId={prop.id} />
        </div>
      </section>

      {/* 7. WHATSAPP FIXO MOBILE */}
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
                s ? { ...s, index: (s.index - 1 + s.list.length) % s.list.length } : s,
              );
            }}
            className="absolute left-3 sm:left-6 text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img
            src={optimizedImageUrl(lightbox.list[lightbox.index].url, { width: 1920, quality: 82 })}
            alt=""
            className="max-h-[90vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((s) => (s ? { ...s, index: (s.index + 1) % s.list.length } : s));
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

function SectionHeading({
  children,
  size = 28,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: size,
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
  onOpen,
}: {
  title: string;
  images: PropImage[];
  bg: string;
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
            style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
          >
            {images.map((img, i) => (
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
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            ))}
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

function PropertyContactForm({ propertyId }: { propertyId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    defaultValues: { name: "", whatsapp: "", message: "" },
  });

  const onSubmit = async (values: ContactFormValues) => {
    const { error } = await supabase.from("leads").insert({
      name: values.name.trim(),
      phone: values.whatsapp.trim() || null,
      message: values.message.trim() || null,
      property_id: propertyId,
      source: "imovel",
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
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
        />
        {errors.name && (
          <p className="mt-1 text-xs" style={{ color: "#ff8a8a" }}>
            {errors.name.message}
          </p>
        )}
      </div>
      <div>
        <input
          placeholder="WhatsApp *"
          type="tel"
          {...register("whatsapp", {
            required: "Informe seu WhatsApp",
            maxLength: { value: 30, message: "Máximo 30 caracteres" },
          })}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
        />
        {errors.whatsapp && (
          <p className="mt-1 text-xs" style={{ color: "#ff8a8a" }}>
            {errors.whatsapp.message}
          </p>
        )}
      </div>
      <textarea
        placeholder="Mensagem (opcional)"
        rows={4}
        {...register("message", { maxLength: 1000 })}
        style={{ ...inputStyle, resize: "vertical" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
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
