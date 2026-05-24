import { createFileRoute, redirect, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { orderedImages } from "@/lib/development-images";

export const Route = createFileRoute("/empreendimentos/$slug")({
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
  area_from: number | null;
  area_to: number | null;
  images: unknown;
  video_url: string | null;
  virtual_tour_url: string | null;
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

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  message: string;
}

function DevelopmentDetailPage() {
  const { slug } = useParams({ from: "/empreendimentos/$slug" });
  const { data, isLoading, error } = useQuery({
    queryKey: ["development", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("*, regions(name)")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as DevDetail | null;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="aspect-[16/10] w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    throw redirect({ to: "/empreendimentos" });
  }

  return <DevelopmentDetail dev={data} />;
}

function DevelopmentDetail({ dev }: { dev: DevDetail }) {
  const images = orderedImages(dev.images);
  const [activeImg, setActiveImg] = useState(0);
  const delivery = formatDelivery(dev.delivery_date);
  const youtubeId = dev.video_url ? getYouTubeId(dev.video_url) : null;

  const whatsappText = encodeURIComponent(
    `Olá! Tenho interesse no empreendimento ${dev.title}`,
  );
  const whatsappUrl = `https://wa.me/5561999350888?text=${whatsappText}`;

  return (
    <Layout>
      <article className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        {/* 1. Galeria */}
        <section>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface">
            {images.length > 0 ? (
              <img
                src={images[activeImg].url}
                alt={dev.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-[4/3] overflow-hidden rounded-md border transition ${
                    i === activeImg
                      ? "border-primary"
                      : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2. Cabeçalho */}
        <header className="mt-10">
          {dev.status === "pronta_entrega" ? (
            <span className="inline-block rounded-md bg-badge-green px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background">
              Pronta Entrega
            </span>
          ) : dev.status === "previsao" && delivery ? (
            <span className="inline-block rounded-md bg-badge-blue px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background">
              Previsão {delivery}
            </span>
          ) : null}

          <h1 className="mt-4 font-heading text-4xl text-foreground md:text-5xl">
            {dev.title}
          </h1>

          {dev.builder && (
            <p className="mt-3 font-body text-xs uppercase tracking-widest text-muted-foreground">
              {dev.builder}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-sm text-muted-foreground">
            {dev.regions?.name && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {dev.regions.name}
              </span>
            )}
            {dev.typology && dev.typology.length > 0 && (
              <span>{dev.typology.join(" e ")} quartos</span>
            )}
            {(dev.area_from || dev.area_to) && (
              <span>
                {dev.area_from ?? "?"}
                {dev.area_to && dev.area_to !== dev.area_from
                  ? ` a ${dev.area_to}`
                  : ""}{" "}
                m²
              </span>
            )}
          </div>

          {dev.price_from != null && (
            <p className="mt-6 font-body text-lg text-primary">
              A partir de{" "}
              <span className="font-medium">{formatPrice(dev.price_from)}</span>
            </p>
          )}
        </header>

        {/* 3. Descrição */}
        {dev.description && (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-heading text-2xl text-foreground">Sobre o empreendimento</h2>
            <p className="mt-4 whitespace-pre-line font-body text-base leading-relaxed text-foreground/80">
              {dev.description}
            </p>
          </section>
        )}

        {/* 4. Vídeo */}
        {youtubeId && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl text-foreground">Vídeo</h2>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-surface">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`Vídeo - ${dev.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </section>
        )}

        {/* 5. Tour Virtual */}
        {dev.virtual_tour_url && (
          <section className="mt-12">
            <Button asChild variant="outline-gold" size="lg">
              <a href={dev.virtual_tour_url} target="_blank" rel="noopener noreferrer">
                Fazer Tour Virtual
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </section>
        )}

        {/* 6. Formulário */}
        <ContactSection developmentId={dev.id} title={dev.title} />
      </article>

      {/* 7. CTA WhatsApp fixo */}
      <div className="sticky bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <Button asChild variant="primary" size="lg" className="w-full">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Tenho interesse neste empreendimento
          </a>
        </Button>
      </div>
      <div className="mx-auto hidden max-w-6xl px-6 pb-16 md:block">
        <Button asChild variant="primary" size="lg">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Tenho interesse neste empreendimento
          </a>
        </Button>
      </div>
    </Layout>
  );
}

function ContactSection({
  developmentId,
  title,
}: {
  developmentId: string;
  title: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    defaultValues: { name: "", phone: "", email: "", message: "" },
  });

  const onSubmit = async (values: ContactForm) => {
    const { error } = await supabase.from("leads").insert({
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      message: values.message.trim() || null,
      development_id: developmentId,
      source: "empreendimento",
    });

    if (error) {
      console.error("Lead insert error:", error);
      toast.error("Não foi possível enviar sua mensagem. Tente novamente.");
      return;
    }

    toast.success("Mensagem enviada! Bruno entrará em contato em breve.");
    reset();
  };

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="font-heading text-2xl text-foreground">
        Tenho interesse em {title}
      </h2>
      <p className="mt-2 font-body text-sm text-muted-foreground">
        Preencha o formulário e Bruno entrará em contato.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 md:max-w-2xl">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            {...register("name", {
              required: "Informe seu nome",
              maxLength: { value: 100, message: "Máximo 100 caracteres" },
            })}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone", { maxLength: 30 })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { maxLength: 255 })}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            rows={4}
            {...register("message", { maxLength: 1000 })}
          />
        </div>
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar mensagem"}
        </Button>
      </form>
    </section>
  );
}
