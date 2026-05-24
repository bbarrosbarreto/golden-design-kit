import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SubmittedState } from "@/components/contact/SubmittedState";

export const Route = createFileRoute("/contato")({
  component: ContatoPage,
});

const GOLD = "#C9A84C";
const DARK = "#1a1a1a";
const CREAM = "#f8f5f0";

interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

function ContatoPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>();

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        message: values.message.trim(),
      };

      let { error } = await supabase.from("leads").insert({ ...payload, source: "contato" });
      if (error && error.message?.toLowerCase().includes("source")) {
        ({ error } = await supabase.from("leads").insert(payload));
      }

      if (error) throw error;

      toast.success("Mensagem enviada!", {
        description: "Parabéns, você está a um passo de adquirir seu novo imóvel. Em breve nossa equipe entrará em contato para te atender.",
      });
      reset();
      setSubmitted(true);
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    }
  };

  return (
    <Layout>
      {/* HERO */}
      <section
        className="relative flex w-full flex-col items-center justify-center text-center"
        style={{ height: 280, backgroundColor: DARK, padding: "0 5%" }}
      >
        <span
          style={{
            color: GOLD,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Fale comigo
        </span>
        <h1
          className="mt-3 max-w-2xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Vamos encontrar o imóvel certo para você
        </h1>
      </section>

      {/* CORPO */}
      <section style={{ backgroundColor: CREAM, padding: "64px 5%" }}>
        <div
          className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[2fr_3fr] md:gap-16"
          style={{
            opacity: 1,
            animation: "fadeInUp 600ms ease forwards",
          }}
        >
          {/* COLUNA ESQUERDA — INFORMAÇÕES */}
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: DARK,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Informações
            </h2>

            <div className="mt-8 flex flex-col gap-6">
              <ContactItem
                icon={<Phone style={{ color: GOLD, width: 20, height: 20 }} />}
                label="Telefone"
                value="(61) 99935-0888"
                href="tel:+5561999350888"
              />
              <ContactItem
                icon={<Mail style={{ color: GOLD, width: 20, height: 20 }} />}
                label="Email"
                value="brunobarreto.corretor@gmail.com"
                href="mailto:brunobarreto.corretor@gmail.com"
              />
              <ContactItem
                icon={<MapPin style={{ color: GOLD, width: 20, height: 20 }} />}
                label="Endereço"
                value="Brasília, Distrito Federal"
              />
            </div>

            <div
              className="mt-8"
              style={{ borderTop: `1px solid ${GOLD}`, opacity: 0.35 }}
            />

            <p
              className="mt-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "rgba(0,0,0,0.55)",
                lineHeight: 1.6,
              }}
            >
              Atendimento de segunda a sábado, das 9h às 18h.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://instagram.com/brunobarreto.corretor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center transition-opacity hover:opacity-70"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `1px solid ${GOLD}`,
                }}
                aria-label="Instagram"
              >
                <Instagram style={{ color: GOLD, width: 18, height: 18 }} />
              </a>
            </div>
          </div>

          {/* COLUNA DIREITA — FORMULÁRIO */}
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: DARK,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Envie uma mensagem
            </h2>

            {submitted ? (
              <div className="mt-8">
                <SubmittedState
                  variant="light"
                  onReset={() => {
                    reset();
                    setSubmitted(false);
                  }}
                />
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 flex flex-col gap-5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    Nome *
                  </label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    {...register("name", { required: "Informe seu nome" })}
                    className="h-11 bg-white"
                  />
                  {errors.name && (
                    <span className="mt-1 block text-xs text-red-600">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    Email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email", {
                      required: "Informe seu email",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Email inválido",
                      },
                    })}
                    className="h-11 bg-white"
                  />
                  {errors.email && (
                    <span className="mt-1 block text-xs text-red-600">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    Telefone
                  </label>
                  <Input
                    id="phone"
                    placeholder="(61) 99999-9999"
                    {...register("phone")}
                    className="h-11 bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    Mensagem *
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Como posso te ajudar?"
                    {...register("message", { required: "Escreva sua mensagem" })}
                    className="bg-white"
                  />
                  {errors.message && (
                    <span className="mt-1 block text-xs text-red-600">
                      {errors.message.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-11 w-full"
                  style={{
                    backgroundColor: GOLD,
                    color: DARK,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: 0.5,
                    borderRadius: 2,
                  }}
                >
                  {isSubmitting ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.45)",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          className="mt-0.5"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            fontWeight: 500,
            color: DARK,
            margin: 0,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="block transition-opacity hover:opacity-70"
      >
        {content}
      </a>
    );
  }

  return content;
}
